'use strict'
let Rat = require('./../db').Rat
let Epic = require('./../db').Epic
import Query from './'

/**
 * A class representing a rat query
 */
class RatQuery extends Query {
  /**
   * Create a sequelize rat query from a set of parameters
   * @constructor
   * @param params
   * @param connection
   */
  constructor (params, connection) {
    super(params, connection)

    this._query.attributes = {
      exclude: [
        'deletedAt'
      ]
    }
  }
}

export default RatQuery