'use strict'

const db = require('../db').db
const Rat = require('../db').Rat
const Rescue = require('../db').Rescue
const Epic = require('../db').Epic
const RescueQuery = require('../Query/RescueQuery')
const { RescuesPresenter, CustomPresenter } = require('../classes/Presenters')
const EventEmitter = require('events')

const Error = require('../errors')
const Permission = require('../permission')
const BotServ = require('../Anope/BotServ')
const Statistics = require('../classes/Statistics')

const bold = String.fromCharCode(0x02)

class Rescues {
  static async search (ctx) {
    let rescueQuery = new RescueQuery(ctx.query, ctx)
    let result = await Rescue.scope('rescue').findAndCountAll(rescueQuery.toSequelize)
    return RescuesPresenter.render(result.rows, ctx.meta(result, rescueQuery))
  }

  static async findById (ctx) {
    if (ctx.params.id) {
      let rescueQuery = new RescueQuery({ id: ctx.params.id }, ctx)
      let result = await Rescue.scope('rescue').findAndCountAll(rescueQuery.toSequelize)
      return RescuesPresenter.render(result.rows, ctx.meta(result, rescueQuery))
    } else {
      throw Error.template('missing_required_field', 'id')
    }
  }

  static async create (ctx) {
    let result = await Rescue.scope('rescue').create(ctx.data)
    if (!result) {
      throw Error.template('operation_failed')
    }

    ctx.response.status = 201
    let rescue = RescuesPresenter.render(result, ctx.meta(result))
    process.emit('rescueCreated', ctx, rescue)
    return rescue
  }

  static async update (ctx) {
    if (ctx.params.id) {
      let rescue = await Rescue.scope('rescue').findOne({
        where: {
          id: ctx.params.id
        }
      })

      if (!rescue) {
        throw Error.template('not_found', ctx.params.id)
      }

      let permission = getRescuePermissionType(rescue, ctx.state.user)
      if (Permission.require(permission, ctx.state.user, ctx.state.scope)) {
        let rescue = await Rescue.scope('rescue').update(ctx.data, {
          where: {
            id: ctx.params.id
          }
        })

        if (!rescue) {
          throw Error.template('operation_failed')
        }

        let rescueQuery = new RescueQuery({id: ctx.params.id}, ctx)
        let result = await Rescue.scope('rescue').findAndCountAll(rescueQuery.toSequelize)
        let renderedResult = RescuesPresenter.render(result.rows, ctx.meta(result, rescueQuery))
        process.emit('rescueUpdated', ctx, renderedResult, null, ctx.data)
        return renderedResult
      }
    } else {
      throw Error.template('missing_required_field', 'id')
    }
  }

  static async delete (ctx) {
    if (ctx.params.id) {
      let rescue = await Rescue.scope('rescue').findOne({
        where: {
          id: ctx.params.id
        }
      })

      if (!rescue) {
        throw Error.template('not_found', ctx.params.id)
      }

      rescue.destroy()

      process.emit('rescueDeleted', ctx, CustomPresenter.render({
        id: ctx.params.id
      }, {}))
      ctx.status = 204
      return true
    }
  }

  static async assign (ctx) {
    if (Array.isArray(ctx.data) === false && ctx.data.hasOwnProperty('data')) {
      ctx.data = ctx.data.data
    }

    if (ctx.params.id) {
      let rescue = await Rescue.scope('rescue').findOne({
        where: {
          id: ctx.params.id
        }
      })

      if (!rescue) {
        throw Error.template('not_found', ctx.params.id)
      }

      let permission = getRescuePermissionType(rescue, ctx.state.user)
      if (Permission.require(permission, ctx.state.user, ctx.state.scope)) {
        let rats = ctx.data.map((rat) => {
          return rescue.addRat(rat)
        })

        await Promise.all(rats)

        let rescueQuery = new RescueQuery({ id: ctx.params.id }, ctx)
        let result = await Rescue.scope('rescue').findAndCountAll(rescueQuery.toSequelize)
        let renderedResult = RescuesPresenter.render(result.rows, ctx.meta(result, rescueQuery))
        process.emit('rescueUpdated', ctx, renderedResult)
        return renderedResult
      }
    }
  }

  static async unassign (ctx) {
    if (Array.isArray(ctx.data) === false && ctx.data.hasOwnProperty('data')) {
      ctx.data = ctx.data.data
    }

    if (ctx.params.id) {
      let rescue = await Rescue.scope('rescue').findOne({
        where: {
          id: ctx.params.id
        }
      })

      if (!rescue) {
        throw Error.template('not_found', ctx.params.id)
      }

      let permission = getRescuePermissionType(rescue, ctx.state.user)
      if (Permission.require(permission, ctx.state.user, ctx.state.scope)) {
        let rats = ctx.data.map((rat) => {
          return rescue.removeRat(rat)
        })

        await Promise.all(rats)

        let rescueQuery = new RescueQuery({ id: ctx.params.id }, ctx)
        let result = await Rescue.scope('rescue').findAndCountAll(rescueQuery.toSequelize)
        let renderedResult = RescuesPresenter.render(result.rows, ctx.meta(result, rescueQuery))
        process.emit('rescueUpdated', ctx, renderedResult)
        return renderedResult
      }
    }
  }

  static async addquote (ctx) {
    if (Array.isArray(ctx.data) === false && ctx.data.hasOwnProperty('data')) {
      ctx.data = ctx.data.data
    }

    if (ctx.params.id) {
      let rescue = await Rescue.scope('rescue').findOne({
        where: {
          id: ctx.params.id
        }
      })

      if (!rescue) {
        throw Error.template('not_found', ctx.params.id)
      }

      let permission = getRescuePermissionType(rescue, ctx.state.user)
      if (Permission.require(permission, ctx.state.user, ctx.scope)) {
        await Rescue.update({
          quotes: rescue.quotes.concat(ctx.data)
        }, {
          where: {
            id: ctx.params.id
          }
        })

        let rescueQuery = new RescueQuery({ id: ctx.params.id }, ctx)
        let result = await Rescue.scope('rescue').findAndCountAll(rescueQuery.toSequelize)
        let renderedResult = RescuesPresenter.render(result.rows, ctx.meta(result, rescueQuery))
        process.emit('rescueUpdated', ctx, renderedResult)
        return renderedResult
      }
    }
  }
}

process.on('rescueUpdated', (ctx, result, permissions, changedValues) => {
  if (!changedValues) {
    return
  }
  if (changedValues.hasOwnProperty('outcome')) {
    let boardIndex = result.data[0].attributes.data.boardIndex
    let caseNumber = boardIndex !== null ? `#${boardIndex}` : result.data[0].id

    let client = ctx.state.user.data.attributes.client || ''
    let author = ctx.state.user.data.attributes.nicknames[0] || ctx.state.user.data.id
    if (ctx.req && ctx.req.headers.hasOwnProperty('x-command-by')) {
      author = ctx.req.headers['x-command-by']
    }
    BotServ.say('#ratchat',
      `${bold}[Paperwork]${bold} Paperwork for rescue ${caseNumber} ${client} has been completed by ${author}`)
  }
})

const selfWriteAllowedPermissions = ['rescue.write.me', 'rescue.write']

function getRescuePermissionType (rescue, user) {
  if (user && rescue.createdAt - Date.now() < 3600000) {
    for (let rat of user.data.relationships.rats.data) {
      if (rescue.rats.find((fRat) => { return fRat.id === rat.id }) || rescue.firstLimpetId === rat.id) {
        return selfWriteAllowedPermissions
      }
    }
  }
  return ['rescue.write']
}
module.exports = Rescues