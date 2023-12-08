const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");
const axios = require("axios");

const databasePath = path.join(__dirname, "ProductTransaction.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
    createTable();
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const createTable = async () => {
  const createQuery = `
    CREATE TABLE  IF NOT EXISTS ProductData(
        id INTEGER ,
        title TEXT,
        price INTEGER,
        description TEXT,
        category TEXT,
        image TEXT,
        sold BOOLEAN,
        dateOfSale DATETIME
    );`;

  await database.run(createQuery);
};

app.get("/initialize-database", async (req, res) => {
  const url = "https://s3.amazonaws.com/roxiler.com/product_transaction.json";
  const response = await axios.get(url);
  const transactionData = await response.data;
  for (const productData of transactionData) {
    const insertQuery = `INSERT INTO ProductData(id,title,price,description,category,image,sold,dateOfSale)
        VALUES(?,?,?,?,?,?,?,?);`;

    await database.run(insertQuery, [
      productData.id,
      productData.title,
      productData.price,
      productData.description,
      productData.category,
      productData.image,
      productData.sold,
      productData.dateOfSale,
    ]);
  }

  res.send({ msg: "Initialize database successfuly" });
});

function convertResultToObjectMethod(responseResult) {
  const categoryObject = {};
  responseResult.map(
    (eachObject) =>
      (categoryObject[eachObject.unique_category] = eachObject.number_of_items)
  );
  // console.log(categoryObject)
  return categoryObject;
}

app.post("/add-roxiler-data/", async (request, response) => {
  const {
    id,
    title,
    price,
    description,
    category,
    image,
    sold,
    dateOfSale,
  } = request.body;
  const addPostData = `
    INSERT INTO 
    roxilerTable 
    (id,title,price,description,category,image,sold,dateOfSale) 
    VALUES (${id}, '${title}', '${price}', 
    '${description}','${category}','${image}',${sold},'${dateOfSale}')
    ;`;
  await database.run(addPostData);
  response.send("RoxilerData Added");
});

app.get("/add-roxiler-data/:addId/", async (request, response) => {
  const { addId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      roxilerTable
    WHERE
      id = ${addId};`;
  const data = await database.get(getTodoQuery);
  response.send(data);
});

app.get("/statistics/category/", async (request, response) => {
  const { month } = request.query;
  if (isMatch(month, "MM")) {
    const monthValue = format(new Date(month), "MM");
    const requestQuery = `
        SELECT 
        DISTINCT category AS unique_category,
        COUNT()AS number_of_items
            FROM 
        roxilerTable 
            WHERE dateOfSale LIKE '%-${monthValue}-%'
            GROUP BY category ;`;
    const responseResult = await database.all(requestQuery);
    const uniqueCategories = convertResultToObjectMethod(responseResult);
    response.send(uniqueCategories);
  } else {
    response.status(400);
    response.send("Invalid Due Month");
  }
});

const getAllTransactions = async (page, perPage, searchText) => {
  // console.log(typeof searchText);
  const getTodoQuery = `
    SELECT
      *
    FROM
      roxilerTable
    WHERE
      title LIKE '%${searchText}%' OR description LIKE '%${searchText}%'
      LIMIT ${perPage} OFFSET ${page}`;
  const data = await database.all(getTodoQuery);
  return data;
};

const getStatistics = async (selectedMonth) => {
  let statistics = [];
  const monthValue = format(new Date(selectedMonth), "MM");

  const total_sale_amt = `
    SELECT 
    SUM(price) AS total_sale_amt
    FROM roxilerTable 
    WHERE dateOfSale LIKE '%-${monthValue}-%' and sold = 1;`;
  const saleResponseResult = await database.all(total_sale_amt);
  statistics.push(saleResponseResult);

  const total_sold_items = `
    SELECT COUNT()AS Total_sold_items
        FROM 
    roxilerTable 
        WHERE 
    dateOfSale LIKE '%-${monthValue}-%' 
        and 
    sold = 1;`;
  const soldResponseResult = await database.all(total_sold_items);
  statistics.push(soldResponseResult);

  const total_unsold_items = `
    SELECT 
    COUNT()AS Total_unSold_items
        FROM 
    roxilerTable 
    WHERE dateOfSale LIKE '%-${monthValue}-%' and sold = 0;`;
  const unSoldResponseResult = await database.all(total_unsold_items);
  statistics.push(unSoldResponseResult);
  return statistics.flat();
};

const getBarChartData = async (selectedMonth) => {
  let barChartData = [];
  let requestQuery = "";
  let reponseResult = null;
  const monthValue = format(new Date(selectedMonth), "MM");

  requestQuery = `
        SELECT 
            COUNT() AS items_in0To100_price
        FROM 
        roxilerTable 
            WHERE 
        dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 0 AND 100;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
        COUNT() AS items_in101To200_price
        FROM 
        roxilerTable 
        WHERE 
        dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 101 AND 200;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in201To300_price
        FROM 
        roxilerTable 
        WHERE 
        dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 201 AND 300;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in301To400_price
        FROM 
        roxilerTable 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 301 AND 400;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in401To500_price
        FROM 
        roxilerTable 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 401 AND 500;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in501To600_price
        FROM 
        roxilerTable 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 501 AND 600;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in601To700_price
        FROM 
        roxilerTable 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 601 AND 700;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in701To800_price
        FROM 
        roxilerTable 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 701 AND 800;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in801To900_price
        FROM 
        roxilerTable 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 801 AND 900;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in901Toabove_price
        FROM 
        roxilerTable 
        WHERE 
        dateOfSale LIKE '%-${monthValue}-%' and price >= 901;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);
  return barChartData.flat();
};

app.get("/api/transactions", async (request, response) => {
  const { searchText = "", page, perPage } = request.query;
  const transactions = await getAllTransactions(page, perPage, searchText);
  response.send(transactions);
});

app.get("/api/statistics", async (request, response) => {
  const { selectedMonth } = request.query;
  const statistics = await getStatistics(selectedMonth);
  response.send(statistics);
});

app.get("/api/bar-chart", async (request, response) => {
  const { selectedMonth } = request.query;
  const barChartData = await getBarChartData(selectedMonth);
  response.send(barChartData);
});

app.get("/transactions", async (req, res) => {
  const { month = "", s_query = "", limit = 10, offset = 0 } = req.query;
  const searchQuery = `
    SELECT * FROM ProductData
    WHERE
    (title LIKE ? OR description LIKE ? OR price LIKE ?)
    AND strftime('%m', dateOfSale) LIKE ?
    LIMIT ? OFFSET ?;`;

  const params = [
    `%${s_query}`,
    `%${s_query}`,
    `%${s_query}`,
    `%${month}`,
    limit,
    offset,
  ];

  const totalItemQuery = `SELECT COUNT(id) AS total
    FROM ProductData
    WHERE
    (title LIKE ? OR description LIKE ? OR price LIKE ?)
    AND strftime('%m', dateOfSale) LIKE ?;`;

  const totalparams = [
    `%${s_query}`,
    `%${s_query}`,
    `%${s_query}`,
    `%${month}`,
  ];

  const data = await database.all(searchQuery, params);
  const total = await database.get(totalItemQuery, totalparams);
  res.json({ transactionsData: data, total });
});

app.get("/api/combined-data", async (request, response) => {
  const {
    page = 1,
    perPage = 10,
    searchText = "",
    selectedMonth = 02,
  } = request.query;
  const combinedData = {
    transactions: await getAllTransactions(page, perPage, searchText),
    statistics: await getStatistics(selectedMonth),
    barChartData: await getBarChartData(selectedMonth),
  };
  response.send(combinedData);
});

module.exports = app;
