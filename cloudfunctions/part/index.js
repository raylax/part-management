// 云函数入口文件
const cloud = require('wx-server-sdk')
const DB_LIMIT = 20

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case 'warehouseIn':
      return warehouseIn(event, context)
    case 'warehouseOut':
      return warehouseOut(event, context)
    case 'list':
      return list(event, context)
    case 'get':
      return get(event, context)
    case 'log':
      return log(event, context)
    default:
      return {}
  }
}

async function log({ id, data }, context) {
  return await db.collection('parts').doc(id).update({
    data: {
      logs: _.push([
        {
          ...data,
          createAt: new Date(),
        }
      ])
    }
  })
}

async function get({ id }, context) {
  const { data = null } = await db.collection('parts').doc(id).get()
  return data
}

async function warehouseOut({ id }, context) {
  return await db.collection('parts').doc(id).update({
    data: {
      status: 'WAREHOUSE_OUT',
      warehouseOutAt: new Date(),
      logs: _.push([
        {
          title: '入库',
          type: 2,
          createAt: new Date(),
        }
      ]),
    }
  })
}

async function warehouseIn({ data }, context) {
  return await db.collection('parts').add({
    data: {
      ...data,
      warehousingDate: new Date(data.warehousingDate),
      status: 'WAREHOUSE_IN',
      createAt: new Date(),
      logs: [
        {
          title: '入库',
          type: 1,
          createAt: new Date(),
        }
      ],
    }
  })
}

async function list({ data: { offset, limit, sn } }, context) {
  const where = {}
  if (sn) {
    where['sn'] = db.RegExp({
      regexp: sn,
      options: 'i',
    })
  }
  const { data = [] } = await db
    .collection('parts')
    .where(where)
    .orderBy('createAt', 'desc')
    .skip(offset || 0)
    .limit(limit || DB_LIMIT)
    .get()
  return data
}