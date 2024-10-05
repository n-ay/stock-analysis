const express = require('express');
//const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs/promises');
const _ = require('lodash');
const { v4: uuid } = require('uuid');
const cors = require('cors');

const app = express();
const polygon_api_key = "vFtIp94GNrAetLdLpwbFgz6sI1E3nBFX";
const finnhub_api_key = "cmuu1i9r01qru65i16ggcmuu1i9r01qru65i16h0";

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

//MongoDB User: anasim Password: aABCD123RGz

/*****MONGODB Stuff */


const { MongoClient, ServerApiVersion } = require('mongodb');
//const uri = "mongodb+srv://anasim:EternalSunshine@J3@cluster0.gijert2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
//const uri2="mongodb://username:password@hostname:port/database"
//mongodb+srv://anasim:aABCD123RGz@hwcluster.shgvh8p.mongodb.net/?retryWrites=true&w=majority&appName=HWCluster
// const uri = "mongodb+srv://anasim:aABCD123RGz@cluster0.gijert2.mongodb.net/HW3?retryWrites=true&w=majority&appName=HWCluster";
const uri = "mongodb+srv://anasim:aABCD123RGz@hwcluster.shgvh8p.mongodb.net/?retryWrites=true&w=majority&appName=HWCluster"


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);



/* MONGO DB STUFF END */
// Route handler for /autocomplete
app.get('/autocomplete', async (req, res) => {
    try {
        const { q } = req.query; // Get the 'q' query parameter for the search query
        if (!q) {
            return res.status(400).json({ error: 'Search query parameter (q) is required' });
        }

        // Fetch autocomplete suggestions from Finnhub API
        const autocompleteResponse = await fetch(`https://finnhub.io/api/v1/search?q=${q}&token=${finnhub_api_key}`);
        const autocompleteData = await autocompleteResponse.json();

        res.json({ autocompleteData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/search/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker;

        const companyInfo = await fetchCompanyInfo(ticker);

        const historicalData = await fetchHistoricalData(ticker);

         // Fetch autocomplete suggestions
        const autocompleteResponse = await fetch(`https://finnhub.io/api/v1/search?q=${ticker}&token=${finnhub_api_key}`);
        const autocompleteData = await autocompleteResponse.json();

         // Fetch quote data
        const quoteResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhub_api_key}`);
        const quoteData = await quoteResponse.json();

        const insiderSentimentData = await getInsiderSentiment(ticker);

        // Fetch peers
        const peersResponse = await fetch(`https://finnhub.io/api/v1/stock/peers?symbol=${ticker}&token=${finnhub_api_key}`);
        const peersData = await peersResponse.json();

        // Fetch earnings
        const earningsResponse = await fetch(`https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&token=${finnhub_api_key}`);
        const earningsData = await earningsResponse.json();

        // Fetch recommendation
        const recommendationResponse = await fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${finnhub_api_key}`);
        const recommendationData = await recommendationResponse.json();

        // Fetch news
        const fromDate = '2021-09-01'; // Example start date
        const toDate = getCurrentDate();
        const newsResponse = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${finnhub_api_key}`);
        const newsData = await newsResponse.json();

        const hourlyStockResponse = await fetchHourlyStockData(ticker);
        //const hourlyStockData = hourlyStockResponse.json();

        res.json({ companyInfo, historicalData, quoteData, autocompleteData, insiderSentimentData, peersData, earningsData, recommendationData, newsData, hourlyStockResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/watchlist', async (req, res) => {
    try {
        const watchlistData = await fetchWatchlistData();
        res.json({ watchlistData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/portfolio', async (req, res) => {
    try {
        const portfolioData = await fetchPortfolioData();
        res.json({ portfolioData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

async function fetchCompanyInfo(ticker) {
    const apiurl=`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${finnhub_api_key}`;
    console.log(apiurl);
    const response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${finnhub_api_key}`);
    console.log(response);
    return response.json();
}

async function fetchHistoricalData(ticker) {
    //define the correct date ranges here
    const fromDate=getDateTwoYearsAgo();
    const toDate = getCurrentDate();
    const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${ticker}/range/2/year/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=${polygon_api_key}`);
    console.log(response);
    return response.json();
}

async function getInsiderSentiment(ticker) {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Adding 1 because January is 0
        const day = String(today.getDate()).padStart(2, '0');
        const fromDate = `${year}-${month}-01`; // Assuming we want data from the beginning of the current month
        
        const url = `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${ticker}&from=${fromDate}&token=${finnhub_api_key}`;
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching insider sentiment data:', error);
        return { error: 'Error fetching insider sentiment data' };
    }
}

async function fetchWatchlistData() {
    // Fetch watchlist data from some source
}

async function fetchPortfolioData() {
    // Fetch portfolio data from some source
}
function getCurrentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().split('T')[0];
}

function getDateTwoYearsAgo() {
    const currentDate = new Date();
    const twoYearsAgo = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
    return twoYearsAgo.toISOString().split('T')[0];
}
/*
// / Function to fetch hourly stock price data
async function fetchHourlyStockData(ticker) {
    try {
        // Calculate the start and end dates
        const currentDate = new Date();
        const toDate = currentDate.toISOString().split('T')[0];
        const fromDate = new Date(currentDate.getTime() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log(toDate, fromDate);
        // Construct the API endpoint URL
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/hour/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=${polygon_api_key}`;
        console.log(url);
        // Make the HTTP request
        const response = await fetch(url);
        const data = await response.json();

        // Process the response data
        if (data && data.results) {
            // Extract and process the hourly stock price data
            const hourlyData = data.results.map(result => ({
                timestamp: result.t, // Unix timestamp
                closePrice: result.c, // Close price
                volume: result.v // Volume
            }));
            
            return hourlyData;
        } else {
            throw new Error('Error fetching hourly stock data');
        }
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}
*/

async function fetchHourlyStockData(ticker) {
    try {
        // Calculate the start and end dates
        let currentDate = new Date();
        let fromDate;
        
        // If it's Friday, adjust fromDate to 3 days before
        if (currentDate.getDay() === 5) { // Friday
            fromDate = new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before
        } else {
            fromDate = new Date(currentDate.getTime() - 6 * 60 * 60 * 1000); // 6 hours before
        }
        
        const toDate = currentDate.toISOString().split('T')[0];
        fromDate = fromDate.toISOString().split('T')[0];
        
        console.log('From Date:', fromDate);
        console.log('To Date:', toDate);
        
        // Construct the API endpoint URL
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/hour/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=${polygon_api_key}`;
        
        console.log('URL:', url);
        
        // Make the HTTP request
        const response = await fetch(url);
        const data = await response.json();

        // Process the response data
        if (data && data.results) {
            // Return the entire data
            return data.results;
        } else {
            throw new Error('Error fetching hourly stock data');
        }
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}
