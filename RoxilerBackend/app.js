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
        price TEXT,
        description TEXT,
        category TEXT,
        image TEXT,
        sold BOOLEAN,
        dateOfSale DATETIME
    );`;

  await database.run(createQuery);
};

const getInitializedDatabase = async () => {
  const url = "https://s3.amazonaws.com/roxiler.com/product_transaction.json";
  const responseData = await axios.get(url);
  const transactionData = await responseData.data;
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

  return { msg: "Initialize database successfuly" };
};

app.get("/initialize-database", async (request, response) => {
  const initializedDatabase = await getInitializedDatabase();
  response.send(initializedDatabase);
});

const getAllTransactions = async (limit, offset, searchText, selectedMonth) => {
  // console.log(selectedMonth);
  const monthValue = format(new Date(selectedMonth), "MM");

  const getTodoQuery = `
     SELECT
      *
    FROM
      ProductData
    WHERE
      (title LIKE '%${searchText}%' OR description LIKE '%${searchText}%' OR price LIKE '%${searchText}%')
      AND dateOfSale LIKE '%-${monthValue}-%'
      
      `;

  const totalSearchedItems = `
     SELECT
      count(id) as total
    FROM
      ProductData
    WHERE
      (title LIKE '%${searchText}%' OR description LIKE '%${searchText}%' OR price LIKE '%${searchText}%')
      AND dateOfSale LIKE '%-${monthValue}-%' 
      `;
  const todoQuery = await database.all(getTodoQuery);
  const totalItems = await database.get(totalSearchedItems);
  return { transactionsData: todoQuery, totalItems };
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
  const monthValue = format(new Date(selectedMonth), "MM");
  const barChartData = [];

  const priceRange = [
    { min: 0, max: 100 },
    { min: 101, max: 200 },
    { min: 201, max: 300 },
    { min: 301, max: 400 },
    { min: 401, max: 500 },
    { min: 501, max: 600 },
    { min: 601, max: 700 },
    { min: 701, max: 800 },
    { min: 801, max: 900 },
    { min: 901, max: 10000 },
  ];

  for (let range of priceRange) {
    const total = await database.get(`SELECT 
            COUNT() AS count
        FROM 
        ProductData 
            WHERE 
        dateOfSale LIKE '%-${monthValue}-%' and price BETWEEN ${range.min} AND ${range.max};`);

    barChartData.push({
      priceRange: `${range.min}-${range.max}`,
      totalItems: total.count,
    });
  }

  return barChartData;
};

const getPieChartData = async (selectedMonth) => {
  const monthValue = format(new Date(selectedMonth), "MM");
  const pieChartData = await database.all(`
    SELECT 
    category,count(id) as items 
    FROM ProductData 
    WHERE dateOfSale LIKE '%-${monthValue}-%' 
    GROUP BY category;
  `);
  return pieChartData;
};

app.get("/transactions", async (request, response) => {
  const {
    searchText = "",
    selectedMonth = "",
    limit = 10,
    offset = 1,
  } = request.query;
  const transactions = await getAllTransactions(
    searchText,
    selectedMonth,
    limit,
    offset
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

app.get("/pie-chart", async (request, response) => {
  const { selectedMonth } = request.query;
  const pieChartData = await getPieChartData(selectedMonth);
  response.send(pieChartData);
});

app.get("/combined-data", async (request, response) => {
  const {
    searchText = "",
    selectedMonth = "",
    limit = 10,
    offset = 1,
  } = request.query;
  const combinedData = {
    initializeDatabase: await getInitializedDatabase(),
    transactions: await getAllTransactions(
      searchText,
      selectedMonth,
      limit,
      offset
    ),
    statistics: await getStatistics(selectedMonth),
    barChartData: await getBarChartData(selectedMonth),
    pieChartData: await getPieChartData(selectedMonth),
  };
  response.send(combinedData);
});

/*
app.get("/combined-data", async (req, res) => {
  const {
    selectedMonth = "",
    searchText = "",
    limit = 10,
    offset = 0,
  } = req.query;

  const initializeDatabase = await axios.get(
    `https://roxiler-systems-assignment.onrender.com/initialize-database`
  );
  const initializeResponse = await initializeDatabase.data;
  const TransactionsData = await axios.get(
    `https://roxiler-systems-assignment.onrender.com/transactions?month=${selectedMonth}&searchText=${searchText}&limit=${limit}&offset=${offset}`
  );
  const TransactionsResponse = await TransactionsData.data;
  const statisticsData = await axios.get(
    `https://roxiler-systems-assignment.onrender.com/statistics?month=${selectedMonth}`
  );
  const statisticsResponse = await statisticsData.data;
  const barChartResponse = await axios.get(
    `https://roxiler-systems-assignment.onrender.com/bar-chart?month=${selectedMonth}`
  );
  const barChartData = await barChartResponse.data;
  const pieChartResponse = await axios.get(
    `https://roxiler-systems-assignment.onrender.com/pie-chart?month=${selectedMonth}`
  );
  const pieChartData = await pieChartResponse.data;

  const combinedResponse = {
    initialize: initializeResponse,
    listTransactions: TransactionsResponse,
    statistics: statisticsResponse,
    barChart: barChartData,
    pieChart: pieChartData,
  };

  res.json(combinedResponse);
});
*/
module.exports = app;
