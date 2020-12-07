export const showModal = (content, title = '提示') => {
  return new Promise(function (resolve, reject) {
    wx.showModal({
      title: title,
      content: content,
      success (res) {
        if (res.confirm) {
          resolve(true)
          return
        }
        resolve(false)
      }
    })
  })
}