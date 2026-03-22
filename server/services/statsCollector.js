// Previous samples for computing per-second delta rates
const previousSamples = new Map()

export const STATS_COMMAND = `\
uname -s; echo '---UNAME_END---'; \
cat /proc/stat; echo '---CPU_END---'; \
cat /proc/meminfo; echo '---MEM_END---'; \
cat /proc/diskstats; echo '---DISK_END---'; \
cat /proc/net/dev; echo '---NET_END---'; \
cat /proc/uptime; echo '---UPTIME_END---'; \
cat /proc/loadavg; echo '---LOADAVG_END---'; \
ps aux --sort=-%cpu 2>/dev/null | head -11; echo '---PS_END---'; \
nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits 2>/dev/null || echo 'NO_GPU'; echo '---GPU_END---'`

export function parseStats(raw, sessionId) {
  const sections = splitSections(raw)

  const platform = sections['UNAME']?.trim()
  if (platform && platform !== 'Linux') {
    return { unsupported: true, platform }
  }

  const now = Date.now()
  const prev = previousSamples.get(sessionId) || null

  const cpuRaw = parseCpuRaw(sections['CPU'] || '')
  const memRaw = parseMeminfo(sections['MEM'] || '')
  const diskRaw = parseDiskstats(sections['DISK'] || '')
  const netRaw = parseNetDev(sections['NET'] || '')
  const uptimeRaw = parseUptime(sections['UPTIME'] || '')
  const loadavgRaw = parseLoadavg(sections['LOADAVG'] || '')
  const processes = parsePs(sections['PS'] || '')
  const gpus = parseGpu(sections['GPU'] || '')

  // Compute CPU percentages
  const cpuCores = computeCpuPct(cpuRaw, prev?.cpuRaw)
  // Compute disk rates
  const disk = computeDiskRates(diskRaw, prev?.diskRaw, prev?.timestamp, now)
  // Compute network rates
  const network = computeNetRates(netRaw, prev?.netRaw, prev?.timestamp, now)

  // Store current as previous
  previousSamples.set(sessionId, { cpuRaw, diskRaw, netRaw, timestamp: now })

  return {
    type: 'stats',
    timestamp: now,
    cpu: { cores: cpuCores, loadAvg: loadavgRaw },
    memory: memRaw,
    gpu: gpus,
    disk,
    network,
    uptime: uptimeRaw,
    processes,
  }
}

export function clearSample(sessionId) {
  previousSamples.delete(sessionId)
}

// --- Section splitter ---
function splitSections(raw) {
  const result = {}
  const markers = ['UNAME', 'CPU', 'MEM', 'DISK', 'NET', 'UPTIME', 'LOADAVG', 'PS', 'GPU']
  let remaining = raw
  for (const marker of markers) {
    const sep = `---${marker}_END---`
    const idx = remaining.indexOf(sep)
    if (idx !== -1) {
      result[marker] = remaining.slice(0, idx)
      remaining = remaining.slice(idx + sep.length)
    }
  }
  return result
}

// --- CPU ---
function parseCpuRaw(text) {
  const lines = text.trim().split('\n').filter(l => /^cpu\d+/.test(l))
  return lines.map(line => {
    const parts = line.split(/\s+/)
    return {
      name: parts[0],
      user: +parts[1], nice: +parts[2], system: +parts[3],
      idle: +parts[4], iowait: +parts[5], irq: +parts[6], softirq: +parts[7],
    }
  })
}

function computeCpuPct(current, previous) {
  if (!previous || previous.length !== current.length) {
    return current.map(() => 0)
  }
  return current.map((cur, i) => {
    const prev = previous[i]
    const curTotal = cur.user + cur.nice + cur.system + cur.idle + cur.iowait + cur.irq + cur.softirq
    const prevTotal = prev.user + prev.nice + prev.system + prev.idle + prev.iowait + prev.irq + prev.softirq
    const totalDiff = curTotal - prevTotal
    const idleDiff = cur.idle - prev.idle
    if (totalDiff === 0) return 0
    return Math.round(((totalDiff - idleDiff) / totalDiff) * 1000) / 10
  })
}

// --- Memory ---
function parseMeminfo(text) {
  const get = (key) => {
    const m = text.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'))
    return m ? +m[1] : 0
  }
  const total = get('MemTotal')
  const free = get('MemFree')
  const cached = get('Cached')
  const buffers = get('Buffers')
  const available = get('MemAvailable')
  const used = total - available
  return { totalKb: total, usedKb: used, freeKb: free, cachedKb: cached + buffers, availableKb: available }
}

// --- Disk ---
// Matches top-level block devices; excludes partitions like sda1, nvme0n1p1, mmcblk0p1
const DISK_DEVICE_RE = /^(sd[a-z]+|hd[a-z]+|vd[a-z]+|xvd[a-z]+|nvme\d+n\d+|mmcblk\d+|md\d+)$/

function parseDiskstats(text) {
  const result = {}
  for (const line of text.trim().split('\n')) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 14) continue
    const name = parts[2]
    if (!DISK_DEVICE_RE.test(name)) continue
    result[name] = {
      readsCompleted: +parts[3],
      writesCompleted: +parts[7],
    }
  }
  return result
}

function computeDiskRates(current, previous, prevTime, nowTime) {
  const result = {}
  if (!previous || !prevTime) return result
  const elapsed = (nowTime - prevTime) / 1000
  if (elapsed <= 0) return result
  for (const [dev, cur] of Object.entries(current)) {
    const prev = previous[dev]
    if (!prev) continue
    result[dev] = {
      readsPerSec: Math.max(0, Math.round((cur.readsCompleted - prev.readsCompleted) / elapsed)),
      writesPerSec: Math.max(0, Math.round((cur.writesCompleted - prev.writesCompleted) / elapsed)),
    }
  }
  return result
}

// --- Network ---
function parseNetDev(text) {
  const result = {}
  const lines = text.trim().split('\n').slice(2) // skip header lines
  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    const iface = parts[0].replace(':', '')
    if (iface === 'lo') continue
    result[iface] = {
      rxBytes: +parts[1],
      txBytes: +parts[9],
    }
  }
  return result
}

function computeNetRates(current, previous, prevTime, nowTime) {
  const result = {}
  if (!previous || !prevTime) return result
  const elapsed = (nowTime - prevTime) / 1000
  if (elapsed <= 0) return result
  for (const [iface, cur] of Object.entries(current)) {
    const prev = previous[iface]
    if (!prev) continue
    result[iface] = {
      rxBytesPerSec: Math.max(0, Math.round((cur.rxBytes - prev.rxBytes) / elapsed)),
      txBytesPerSec: Math.max(0, Math.round((cur.txBytes - prev.txBytes) / elapsed)),
    }
  }
  return result
}

// --- Uptime ---
function parseUptime(text) {
  const parts = text.trim().split(/\s+/)
  return parseFloat(parts[0]) || 0
}

// --- Load Average ---
function parseLoadavg(text) {
  const parts = text.trim().split(/\s+/)
  return [parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0]
}

// --- Processes ---
function parsePs(text) {
  const lines = text.trim().split('\n').slice(1) // skip header
  return lines.slice(0, 10).map(line => {
    const parts = line.trim().split(/\s+/)
    return {
      user: parts[0] || '',
      pid: +parts[1] || 0,
      cpuPct: parseFloat(parts[2]) || 0,
      memPct: parseFloat(parts[3]) || 0,
      cmd: parts.slice(10).join(' ') || parts[10] || '',
    }
  })
}

// --- GPU ---
function parseGpu(text) {
  if (!text || text.includes('NO_GPU')) return []
  return text.trim().split('\n').map(line => {
    const parts = line.split(',').map(s => s.trim())
    return {
      index: +parts[0] || 0,
      utilPct: +parts[1] || 0,
      memUsedMb: +parts[2] || 0,
      memTotalMb: +parts[3] || 0,
      tempC: +parts[4] || 0,
    }
  }).filter(g => !isNaN(g.index))
}
