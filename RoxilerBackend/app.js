const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");
const axios = require("axios");

const databasePath = path.join(__dirname, "RoxilerTransaction.db");

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

const getAllTransactions = async (page, perPage, searchText, selectedMonth) => {
  // console.log(selectedMonth);
  const monthValue = format(new Date(selectedMonth), "MM");
  // console.log(monthValue);
  const getTodoQuery = `
    SELECT
      *
    FROM
      ProductData
    WHERE
      (title LIKE '%${searchText}%' OR description LIKE '%${searchText}%' OR price LIKE '%${searchText}%')
      AND dateOfSale LIKE '%-${monthValue}-%' 
      LIMIT ${perPage} 
      `;

  const totalSearchedItems = `
     SELECT
      COUNT(id) AS TOTAL
    FROM
      ProductData
    WHERE
      (title LIKE '%${searchText}%' OR description LIKE '%${searchText}%' OR price LIKE '%${searchText}%')
      AND dateOfSale LIKE '%-${monthValue}-%' 
      `;

  const data = await database.all(getTodoQuery);
  const totalItems = await database.get(totalSearchedItems);
  return { transactionsData: data, totalItems };
};

const getStatistics = async (selectedMonth) => {
  let statistics = [];
  const monthValue = format(new Date(selectedMonth), "MM");

  const total_sale_amt = `
    SELECT 
    SUM(price) AS total_sale_amt
    FROM ProductData 
    WHERE dateOfSale LIKE '%-${monthValue}-%' and sold = 1;`;
  const saleResponseResult = await database.all(total_sale_amt);
  statistics.push(saleResponseResult);

  const total_sold_items = `
    SELECT COUNT()AS Total_sold_items
        FROM 
    ProductData 
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
    ProductData
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
        ProductData 
            WHERE 
        dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 0 AND 100;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
        COUNT() AS items_in101To200_price
        FROM 
        ProductData 
        WHERE 
        dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 101 AND 200;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in201To300_price
        FROM 
        ProductData 
        WHERE 
        dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 201 AND 300;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in301To400_price
        FROM 
        ProductData 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 301 AND 400;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in401To500_price
        FROM 
        ProductData 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 401 AND 500;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in501To600_price
        FROM 
        ProductData 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 501 AND 600;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in601To700_price
        FROM 
        ProductData 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 601 AND 700;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in701To800_price
        FROM 
        ProductData 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 701 AND 800;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in801To900_price
        FROM 
        ProductData 
        WHERE dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN 801 AND 900;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);

  requestQuery = `
        SELECT 
            COUNT() AS items_in901Toabove_price
        FROM 
        ProductData 
        WHERE 
        dateOfSale LIKE '%-${monthValue}-%' and price >= 901;`;
  responseResult = await database.all(requestQuery);
  barChartData.push(responseResult);
  return barChartData.flat();
};

app.get("/transactions", async (request, response) => {
  const {
    searchText = "",
    page = 1,
    perPage = 10,
    selectedMonth = "",
  } = request.query;
  const transactions = await getAllTransactions(
    page,
    perPage,
    searchText,
    selectedMonth
  );
  response.send(transactions);
});

app.get("/statistics", async (request, response) => {
  const { selectedMonth } = request.query;
  const statistics = await getStatistics(selectedMonth);
  response.send(statistics);
});

app.get("/bar-chart", async (request, response) => {
  const { selectedMonth } = request.query;
  const barChartData = await getBarChartData(selectedMonth);
  response.send(barChartData);
});

app.get("/combined-data", async (request, response) => {
  const {
    page = 1,
    perPage = 10,
    searchText = "",
    selectedMonth = "",
  } = request.query;
  const combinedData = {
    transactions: await getAllTransactions(
      page,
      perPage,
      searchText,
      selectedMonth
    ),
    statistics: await getStatistics(selectedMonth),
    barChartData: await getBarChartData(selectedMonth),
  };
  response.send(combinedData);
});

module.exports = app;
