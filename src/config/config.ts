function required(name: string, fallback: () => void) {
  const v = process.env[name]
  if(v === undefined || v === '') {
    if(fallback !== undefined) return fallback
    throw new Error(`Missing required env var: ${name}`)
  }
  return v
}

const cfg = {
  
}