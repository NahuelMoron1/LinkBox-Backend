import { DataTypes } from "sequelize";
import db from "../../db/connection";

const TelemetrySession = db.define(
  "TelemetrySessions",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    device_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Devices",
        key: "id",
      },
    },
    session_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Nombre de la sesión (ej: Ruta al trabajo)",
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    total_records: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("recording", "completed", "draft"),
      allowNull: false,
      defaultValue: "recording",
    },
    saved_by_user: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "True si el usuario manualmente guardó (Plan Pro)",
    },
  },
  {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["device_id"] },
      { fields: ["status"] },
      { fields: ["created_at"] },
      { fields: ["device_id", "status"] },
    ],
  },
);

export default TelemetrySession;
