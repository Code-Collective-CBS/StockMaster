import { stockAPI } from "./stockScripts/api.js";

// PRESENT IN THE SECURITIES-NEWS.JS MAYBE MOVE IT?
const topPicksSymbols = [
    {
        symbol: "I:NDX",
        htmlElement: document.getElementById("I:NDX"),
    },
    {
        symbol: "I:CX10GI",
        htmlElement: document.getElementById("I:CX10GI"),
    },
    {
        symbol: "I:CX35PI",
        htmlElement: document.getElementById("I:CX35PI"),
    },
    {
        symbol: "I:CX20GI",
        htmlElement: document.getElementById("I:CX20GI"),
    },
];

document.addEventListener("DOMContentLoaded", () => {
    const newsContainerAuthor = document.getElementById("news-author");
    const newsContainerDescription = document.getElementById("news-description");

    //// TOP PICKS ////

    topPicksSymbols.forEach(async (topPick) => {
        try {
            const data = await stockAPI.getIndicesoverview(topPick.symbol); // Use the parsed JSON directly
            const closedPrice = data.results[0].c;

            if (topPick.htmlElement) {
                const marketPriceElement = topPick.htmlElement.querySelector(".market-price");
                marketPriceElement.innerHTML = `${parseFloat(closedPrice.toFixed(1)) || "N/A"}`;
            }
        } catch (error) {
            console.error(`Error fetching top pick (${topPick}):`, error);
        }
    });

    //// NEWS ////

    const gethNews = async () => {
        try {
            const data = await stockAPI.getNews();
            const randomNumber = Math.floor(Math.random() * data.results.length);
            const article = data.results[randomNumber];

            newsContainerAuthor.innerHTML = article.author;
            newsContainerDescription.innerHTML = `${article.description}<br><br><a href="${article.article_url}" target="_blank">Read more here</a>`;
        } catch (error) {
            console.error('Error fetching news: ', error);
        }
    };
    gethNews();
});