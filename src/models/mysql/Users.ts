import { DataTypes } from "sequelize";
import db from "../../db/connection";

const Users = db.define(
  "users",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // Genera UUID automáticamente
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    defaultScope: {
      attributes: { exclude: ["password", "userID", "email"] },
    },
    scopes: {
      withAll: {
        attributes: { include: ["password", "userID", "email"] },
      },
    },
  }
);

export default Users;
