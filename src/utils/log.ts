import { invoke } from '@tauri-apps/api'

enum LogLevel {
  /**
   * The "trace" level.
   *
   * Designates very low priority, often extremely verbose, information.
   */
  Trace = 1,
  /**
   * The "debug" level.
   *
   * Designates lower priority information.
   */
  Debug,
  /**
   * The "info" level.
   *
   * Designates useful information.
   */
  Info,
  /**
   * The "warn" level.
   *
   * Designates hazardous situations.
   */
  Warn,
  /**
   * The "error" level.
   *
   * Designates very serious errors.
   */
  Error,
}

const log = async (level: LogLevel, location: String, ...data: any[]) => {
  const message = data
    .map((arg) => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2)
      }
      return String(arg)
    })
    .join(' ')

  await invoke('log', {
    level,
    message,
    location,
  })
}

export class Logger {
  private readonly location: string

  constructor(...locations: string[]) {
    this.location = locations.join('::')
  }

  error(...locations: string[]) {
    return error(this.location, ...locations)
  }

  warn(...locations: string[]) {
    return warn(this.location, ...locations)
  }

  info(...locations: string[]) {
    return info(this.location, ...locations)
  }

  debug(...locations: string[]) {
    return debug(this.location, ...locations)
  }

  trace(...locations: string[]) {
    return trace(this.location, ...locations)
  }
}

export const error = (...locations: String[]) => {
  const location = locations.join('::')
  return (...data: any[]) => {
    console.error(location, ...data)
    log(LogLevel.Error, location, ...data).catch(console.error)
  }
}

export const warn = (...locations: String[]) => {
  const location = locations.join('::')
  return (...data: any[]) => {
    console.warn(location, ...data)
    log(LogLevel.Warn, location, ...data).catch(console.error)
  }
}

export const info = (...locations: String[]) => {
  const location = locations.join('::')
  return (...data: any[]) => {
    console.info(location, ...data)
    log(LogLevel.Info, location, ...data).catch(console.error)
  }
}

export const debug = (...locations: String[]) => {
  const location = locations.join('::')
  return (...data: any[]) => {
    console.debug(location, ...data)
    log(LogLevel.Debug, location, ...data).catch(console.error)
  }
}

export const trace = (...locations: String[]) => {
  const location = locations.join('::')
  return (...data: any[]) => {
    console.trace(location, ...data)
    log(LogLevel.Trace, location, ...data).catch(console.error)
  }
}
