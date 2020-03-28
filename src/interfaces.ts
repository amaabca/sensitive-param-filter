interface ExaminedObjects {
  copy: any
  original: any
}

interface SpfInterface {
  params: string[]
  replacement: string
  whitelist: string[]
}

interface WhiteListRegex {
  test: () => boolean
}

export {
  ExaminedObjects,
  SpfInterface,
  WhiteListRegex
}
