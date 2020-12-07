export const trimSn = (sn) => {
  return (sn.match(/[a-z|A-Z|0-9]/g) || []).join('').toUpperCase()
}