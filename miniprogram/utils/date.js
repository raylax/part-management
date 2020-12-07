import moment from 'moment'

export const formatDate = (day) => {
  return moment(typeof day === 'string' ? new Date(day) : day).format('yyyy年MM月DD日')
}

export const formatDateTime = (day) => {
  return moment(typeof day === 'string' ? new Date(day) : day).format('yyyy年MM月DD日 HH时mm分')
}
