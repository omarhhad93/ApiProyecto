const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://billyburgos04:0pfyc6qGNHwSS3LC@cluster0.aihuoms.mongodb.net/?retryWrites=true&w=majority";
// const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri);

let db;

async function connect() {
  try {
    await client.connect();
    db = client.db("Proyecto1");

    console.log("Conectado a la base de datos MongoDB");
  } catch (error) {
    console.error("Error al conectar a la base de datos, error:", error);
  }
}

function getDB() {
  return db;
}

module.exports = {connect, getDB,};
