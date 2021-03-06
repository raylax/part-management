import Dialog from '../miniprogram_npm/@vant/weapp/dialog/dialog'

export const confirm = (message, title = '提示') => {
  return new Promise(function (resolve, reject) {
    Dialog.confirm({
      title: title,
      message: message,
    })
    .then(() => resolve(true))
    .catch(() => resolve(false));
  })
}

export const alert = (message, title) => {
  return new Promise(function (resolve, reject) {
    Dialog.alert({
      title: title,
      message: message,
    })
    .then(() => resolve(true));
  })
}