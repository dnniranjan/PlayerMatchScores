const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running ar http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbobject) => {
  return {
    playerId: dbobject["player_id"],
    playerName: dbobject["player_name"],
  };
};

app.get("/players/", async (request, response) => {
  const query = `SELECT * FROM player_details;`;
  const array = await db.all(query);
  //console.log(array);
  response.send(
    array.map((eachPlayer) => {
      return convertDbObjectToResponseObject(eachPlayer);
    })
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const array = await db.get(query);
  //console.log(array);
  response.send(
    array.map((eachPlayer) => {
      return convertDbObjectToResponseObject(eachPlayer);
    })
  );
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const query = `UPDATE player_details SET player_name='${playerName}' where player_id=${playerId};`;
  await db.run(query);
  response.send("Player Details Updated");
});

const convertDbObjectToResponseObject2 = (dbobject) => {
  return {
    matchId: dbobject["match_id"],
    match: dbobject["match"],
    year: dbobject["year"],
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const array = await db.all(query);
  response.send(
    array.map((eachItem) => {
      return convertDbObjectToResponseObject2(eachItem);
    })
  );
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id=${playerId};`;
  const array = await db.all(query);
  response.send(
    array.map((eachItem) => {
      return convertDbObjectToResponseObject2(eachItem);
    })
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const array = await db.all(query);
  response.send(array);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `
	SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const array = await db.get(query);
  response.send(array);
});

module.exports = app;
