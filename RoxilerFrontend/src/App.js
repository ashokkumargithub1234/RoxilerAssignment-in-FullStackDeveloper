import { Component } from "react";
// import { TailSpin } from "react-loader-spinner";
// import Transactions from "./Components/Transactions";
// import Statistics from "./Components/Statistics";
// import BarChartComponent from "./Components/BarChart";
// import PieChartComponent from "./Components/PieChart";
import "./App.css";
/*
const apiStatusConstants = {
  success: "SUCCESS",
  failure: "FAILURE",
  inProgress: "IN_PROGRESS",
  initial: "INITIAL",
};

const months = [
  { value: "", displayText: "Select Month" },
  { value: "01", displayText: "January" },
  { value: "02", displayText: "February" },
  { value: "03", displayText: "March" },
  { value: "04", displayText: "April" },
  { value: "05", displayText: "May" },
  { value: "06", displayText: "June" },
  { value: "07", displayText: "July" },
  { value: "08", displayText: "August" },
  { value: "09", displayText: "September" },
  { value: "10", displayText: "October" },
  { value: "11", displayText: "November" },
  { value: "12", displayText: "December" },
];
*/

class App extends Component {
  componentDidMount() {
    this.getProductTransactionData();
  }
  getProductTransactionData = async () => {
    const url = `/combined-data?searchText&page=0&perPage=10&selectedMonth=05`;
    const response = await fetch(url);
    console.log(response);
  };

  render() {
    return (
      <div>
        <h1>Ashok</h1>
      </div>
    );
  }
}

export default App;
