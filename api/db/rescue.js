'use strict'

module.exports = function (sequelize, DataTypes) {
  let Rescue = sequelize.define('Rescue', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    client: {
      type: DataTypes.STRING,
      allowNull: true
    },
    codeRed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    epic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    open: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    platform: {
      type: DataTypes.ENUM('xb', 'pc', 'unknown'),
      allowNull: true,
      defaultValue: 'pc'
    },
    quotes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    successful: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    system: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    unidentifiedRats: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    }
  }, {
    classMethods: {
      associate: function (models) {
        Rescue.belongsToMany(models.Rat, { as: 'rats', through: 'RescueRats' })
        Rescue.belongsTo(models.Rat, { as: 'firstLimpet' })
      }
    }
  })

  return Rescue
}