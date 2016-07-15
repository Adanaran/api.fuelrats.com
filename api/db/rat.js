'use strict'

module.exports = function (sequelize, DataTypes) {
  let Rat = sequelize.define('Rat', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    CMDRname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    joined: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    platform: {
      type: DataTypes.ENUM('pc', 'xb'),
      allowNull: false,
      defaultValue: 'pc'
    }
  })

  return Rat
}