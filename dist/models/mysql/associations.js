"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrueOrFalse_Statements = exports.TrueOrFalse = exports.Tracks = exports.TimelineEvent = exports.Timeline = exports.Teams = exports.Seasons = exports.Season_Tracks = exports.Season_Teams_Drivers = exports.Season_Teams = exports.Impostors_Results = exports.Impostors = exports.H2HGames = exports.GuessTeams = exports.GuessDrivers_Teams = exports.GuessDrivers = exports.GuessCareers_Teams = exports.GuessCareers = exports.Drivers = exports.Connections_Groups_Results = exports.Connections_Groups = exports.Connections = void 0;
const Connections_js_1 = __importDefault(require("./Connections.js"));
exports.Connections = Connections_js_1.default;
const Connections_Groups_js_1 = __importDefault(require("./Connections_Groups.js"));
exports.Connections_Groups = Connections_Groups_js_1.default;
const Connections_Groups_Results_js_1 = __importDefault(require("./Connections_Groups_Results.js"));
exports.Connections_Groups_Results = Connections_Groups_Results_js_1.default;
const Drivers_js_1 = __importDefault(require("./Drivers.js"));
exports.Drivers = Drivers_js_1.default;
const GuessCareers_js_1 = __importDefault(require("./GuessCareers.js"));
exports.GuessCareers = GuessCareers_js_1.default;
const GuessCareers_Teams_js_1 = __importDefault(require("./GuessCareers_Teams.js"));
exports.GuessCareers_Teams = GuessCareers_Teams_js_1.default;
const GuessDrivers_js_1 = __importDefault(require("./GuessDrivers.js"));
exports.GuessDrivers = GuessDrivers_js_1.default;
const GuessDrivers_Teams_js_1 = __importDefault(require("./GuessDrivers_Teams.js"));
exports.GuessDrivers_Teams = GuessDrivers_Teams_js_1.default;
const GuessTeams_js_1 = __importDefault(require("./GuessTeams.js"));
exports.GuessTeams = GuessTeams_js_1.default;
const H2HGames_js_1 = __importDefault(require("./H2HGames.js"));
exports.H2HGames = H2HGames_js_1.default;
const Impostors_js_1 = __importDefault(require("./Impostors.js"));
exports.Impostors = Impostors_js_1.default;
const Impostors_Results_js_1 = __importDefault(require("./Impostors_Results.js"));
exports.Impostors_Results = Impostors_Results_js_1.default;
const Season_Teams_js_1 = __importDefault(require("./Season_Teams.js"));
exports.Season_Teams = Season_Teams_js_1.default;
const Season_Teams_Drivers_js_1 = __importDefault(require("./Season_Teams_Drivers.js")); // Importa la nueva tabla
exports.Season_Teams_Drivers = Season_Teams_Drivers_js_1.default;
const Seasons_js_1 = __importDefault(require("./Seasons.js"));
exports.Seasons = Seasons_js_1.default;
const Seasons_Tracks_js_1 = __importDefault(require("./Seasons_Tracks.js"));
exports.Season_Tracks = Seasons_Tracks_js_1.default;
const Teams_js_1 = __importDefault(require("./Teams.js"));
exports.Teams = Teams_js_1.default;
const Timeline_js_1 = __importDefault(require("./Timeline.js"));
exports.Timeline = Timeline_js_1.default;
const TimelineEvent_js_1 = __importDefault(require("./TimelineEvent.js"));
exports.TimelineEvent = TimelineEvent_js_1.default;
const Tracks_js_1 = __importDefault(require("./Tracks.js"));
exports.Tracks = Tracks_js_1.default;
const TrueOrFalse_js_1 = __importDefault(require("./TrueOrFalse.js"));
exports.TrueOrFalse = TrueOrFalse_js_1.default;
const TrueOrFalse_Statements_js_1 = __importDefault(require("./TrueOrFalse_Statements.js"));
exports.TrueOrFalse_Statements = TrueOrFalse_Statements_js_1.default;
// --- Asociaciones de muchos a muchos ---
// Asociación entre Seasons y Teams (a través de la tabla Season_Teams)
Seasons_js_1.default.hasMany(Season_Teams_js_1.default, { foreignKey: "seasonID" });
Season_Teams_js_1.default.belongsTo(Seasons_js_1.default, {
    foreignKey: "seasonID",
    targetKey: "id",
});
Teams_js_1.default.hasMany(Season_Teams_js_1.default, { foreignKey: "teamID" });
Season_Teams_js_1.default.belongsTo(Teams_js_1.default, {
    foreignKey: "teamID",
    targetKey: "id",
});
// Asociación entre Seasons y Tracks (a través de la tabla Season_Tracks)
Seasons_js_1.default.hasMany(Seasons_Tracks_js_1.default, { foreignKey: "seasonID" });
Seasons_Tracks_js_1.default.belongsTo(Seasons_js_1.default, {
    foreignKey: "seasonID",
    targetKey: "id",
});
Tracks_js_1.default.hasMany(Seasons_Tracks_js_1.default, { foreignKey: "trackID" });
Seasons_Tracks_js_1.default.belongsTo(Tracks_js_1.default, {
    foreignKey: "trackID",
    targetKey: "id",
});
// --- Asociaciones para la nueva tabla Season_Teams_Drivers ---
// Asociación entre Seasons y Season_Teams_Drivers
Seasons_js_1.default.hasMany(Season_Teams_Drivers_js_1.default, { foreignKey: "seasonID" });
Season_Teams_Drivers_js_1.default.belongsTo(Seasons_js_1.default, {
    foreignKey: "seasonID",
    targetKey: "id",
});
// Asociación entre Teams y Season_Teams_Drivers
Teams_js_1.default.hasMany(Season_Teams_Drivers_js_1.default, { foreignKey: "teamID" });
Season_Teams_Drivers_js_1.default.belongsTo(Teams_js_1.default, {
    foreignKey: "teamID",
    targetKey: "id",
});
// Asociación entre Drivers y Season_Teams_Drivers
Drivers_js_1.default.hasMany(Season_Teams_Drivers_js_1.default, { foreignKey: "driverID" });
Season_Teams_Drivers_js_1.default.belongsTo(Drivers_js_1.default, {
    foreignKey: "driverID",
    targetKey: "id",
});
// Asociación entre Impostors y Impostors_Results
Impostors_js_1.default.hasMany(Impostors_Results_js_1.default, { foreignKey: "gameID" });
Impostors_Results_js_1.default.belongsTo(Impostors_js_1.default, {
    foreignKey: "gameID",
    targetKey: "id",
});
// --- Asociación: Connections → Connections_Groups (1:N)
Connections_js_1.default.hasMany(Connections_Groups_js_1.default, { foreignKey: "gameID" });
Connections_Groups_js_1.default.belongsTo(Connections_js_1.default, {
    foreignKey: "gameID",
    targetKey: "id",
});
// --- Asociación: Connections_Groups → Connections_Groups_Results (1:N)
Connections_Groups_js_1.default.hasMany(Connections_Groups_Results_js_1.default, {
    foreignKey: "groupID",
});
Connections_Groups_Results_js_1.default.belongsTo(Connections_Groups_js_1.default, {
    foreignKey: "groupID",
    targetKey: "id",
});
Teams_js_1.default.hasMany(GuessTeams_js_1.default, { foreignKey: "team_id" });
Drivers_js_1.default.hasMany(GuessTeams_js_1.default, { foreignKey: "driver1_id", as: "GuessDriver1" });
Drivers_js_1.default.hasMany(GuessTeams_js_1.default, { foreignKey: "driver2_id", as: "GuessDriver2" });
Seasons_js_1.default.hasMany(GuessTeams_js_1.default, { foreignKey: "season_id" });
GuessTeams_js_1.default.belongsTo(Teams_js_1.default, { foreignKey: "team_id" });
GuessTeams_js_1.default.belongsTo(Drivers_js_1.default, { foreignKey: "driver1_id", as: "Driver1" });
GuessTeams_js_1.default.belongsTo(Drivers_js_1.default, { foreignKey: "driver2_id", as: "Driver2" });
GuessTeams_js_1.default.belongsTo(Seasons_js_1.default, { foreignKey: "season_id" });
// Asociaciones para H2HGames
Teams_js_1.default.hasMany(H2HGames_js_1.default, { foreignKey: "team_id" });
Drivers_js_1.default.hasMany(H2HGames_js_1.default, { foreignKey: "driver1_id", as: "H2HDriver1" });
Drivers_js_1.default.hasMany(H2HGames_js_1.default, { foreignKey: "driver2_id", as: "H2HDriver2" });
H2HGames_js_1.default.belongsTo(Teams_js_1.default, { foreignKey: "team_id" });
H2HGames_js_1.default.belongsTo(Drivers_js_1.default, { foreignKey: "driver1_id", as: "Driver1" });
H2HGames_js_1.default.belongsTo(Drivers_js_1.default, { foreignKey: "driver2_id", as: "Driver2" });
// Asociaciones para GuessCareers
Drivers_js_1.default.hasMany(GuessCareers_js_1.default, { foreignKey: "driver_id" });
GuessCareers_js_1.default.belongsTo(Drivers_js_1.default, { foreignKey: "driver_id" });
// Asociaciones para GuessCareers_Teams
GuessCareers_js_1.default.hasMany(GuessCareers_Teams_js_1.default, { foreignKey: "game_id" });
GuessCareers_Teams_js_1.default.belongsTo(GuessCareers_js_1.default, {
    foreignKey: "game_id",
    targetKey: "id",
});
Teams_js_1.default.hasMany(GuessCareers_Teams_js_1.default, { foreignKey: "team_id" });
GuessCareers_Teams_js_1.default.belongsTo(Teams_js_1.default, {
    foreignKey: "team_id",
    targetKey: "id",
});
// Asociaciones para GuessDrivers
Drivers_js_1.default.hasMany(GuessDrivers_js_1.default, { foreignKey: "driver_id" });
GuessDrivers_js_1.default.belongsTo(Drivers_js_1.default, { foreignKey: "driver_id" });
// Asociaciones para GuessDrivers_Teams
GuessDrivers_js_1.default.hasMany(GuessDrivers_Teams_js_1.default, { foreignKey: "game_id" });
GuessDrivers_Teams_js_1.default.belongsTo(GuessDrivers_js_1.default, {
    foreignKey: "game_id",
    targetKey: "id",
});
Teams_js_1.default.hasMany(GuessDrivers_Teams_js_1.default, { foreignKey: "team_id" });
GuessDrivers_Teams_js_1.default.belongsTo(Teams_js_1.default, {
    foreignKey: "team_id",
    targetKey: "id",
});
Timeline_js_1.default.hasMany(TimelineEvent_js_1.default, {
    foreignKey: "gameID",
    sourceKey: "id",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
TimelineEvent_js_1.default.belongsTo(Timeline_js_1.default, {
    foreignKey: "gameID",
    targetKey: "id",
});
// --- Asociación: TrueOrFalse → TrueOrFalse_Statements (1:N)
TrueOrFalse_js_1.default.hasMany(TrueOrFalse_Statements_js_1.default, { foreignKey: "gameID" });
TrueOrFalse_Statements_js_1.default.belongsTo(TrueOrFalse_js_1.default, {
    foreignKey: "gameID",
    targetKey: "id",
});
// Asociación entre Drivers y TrueOrFalse_Statements
Drivers_js_1.default.hasMany(TrueOrFalse_Statements_js_1.default, { foreignKey: "driverId" });
TrueOrFalse_Statements_js_1.default.belongsTo(Drivers_js_1.default, {
    foreignKey: "driverId",
    targetKey: "id",
});
