import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchDAO } from './dao/search-dao';
import { Profile2DAO } from './dao/profile2-dao';
import { CandleDAO } from './dao/candle-dao';
import { QuoteDAO } from './dao/quote-dao';
import { NewsDAO } from './dao/news-dao';
import { RecommendationDAO } from './dao/recommendation-dao';
import { SocialDAO } from './dao/social-dao';
import { EarningsDAO } from './dao/earnings-dao';

@Injectable({
  providedIn: 'root'
})

export class BackendHelperService {
  private search = '/api/search?';
  private profile2 = '/api/profile2?';
  private candle = '/api/candle?';
  private hourly = '/api/hourly?';
  private quote = '/api/quote?';
  private news = '/api/company-news?';
  private recommendation = '/api/recommendation?';
  private social = '/api/social-sentiment?';
  private peers = '/api/peers?';
  private earnings = '/api/earnings?';
  private marketOpen: boolean = false;
  constructor(private http: HttpClient) {}

  getSearch(q:string) : Observable<SearchDAO> {
    let params = new URLSearchParams();
    params.append('q',q);
    return this.http.get<SearchDAO>(this.search+params);
  }

  getProfile2(symbol:string) : Observable<Profile2DAO> {
    let params = new URLSearchParams();
    params.append('symbol', symbol??'');
    return this.http.get<Profile2DAO>(this.profile2+params);
  }

  getCandle(symbol:string, from:number, to:number) : Observable<CandleDAO> {
    const today = new Date();
    const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    const fromDate = formatDate(twoYearsAgo.getTime() / 1000); 
    const toDate = formatDate(today.getTime() / 1000); 
    console.log("From:", fromDate); 
    console.log("To:", toDate);  
    
    let params = new URLSearchParams();
    params.append('symbol', symbol);
    // params.append('from', from.toString());
    // params.append('to',to.toString());
    params.append('from', fromDate);
    params.append('to',toDate);
    return this.http.get<CandleDAO>(this.candle+params);
  }

  getHourlyCandle(symbol:string, from:string, to:string) : Observable<CandleDAO> {
    
    let params = new URLSearchParams();
    params.append('symbol', symbol);
    params.append('from', from);
    params.append('to',to);
       const url = `${this.hourly}?${params.toString()}`;
       console.log('Request URL:', url);
    return this.http.get<CandleDAO>(this.hourly+params);
  }

  getQuote(symbol:string) : Observable<QuoteDAO> {
    let params = new URLSearchParams();
    params.append('symbol', symbol);
    return this.http.get<QuoteDAO>(this.quote+params);
  }

  getNews(symbol: string) : Observable<NewsDAO[]> {
    let params = new URLSearchParams();
    params.append('symbol', symbol);
    return this.http.get<NewsDAO[]>(this.news+params);
  }

  getRecommendation(symbol: string) : Observable<RecommendationDAO[]> {
    let params = new URLSearchParams();
    params.append('symbol', symbol);
    return this.http.get<RecommendationDAO[]>(this.recommendation+params);
  }

  getSocial(symbol: string) : Observable<SocialDAO> {
    let params = new URLSearchParams();
    params.append('symbol', symbol);
    return this.http.get<SocialDAO>(this.social+params);
  }

  getPeers(symbol: string) : Observable<[]> {
    let params = new URLSearchParams();
    params.append('symbol', symbol);
    return this.http.get<[]>(this.peers+params);
  }

  getEarnings(symbol: string) : Observable<EarningsDAO[]> {
    let params = new URLSearchParams();
    params.append('symbol', symbol);
    return this.http.get<EarningsDAO[]>(this.earnings+params);
  }
  setMarketStatus(open: boolean) {
    this.marketOpen = open;
  }
}

function formatDate(timestamp:number) {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero if needed
  const day = String(date.getDate()).padStart(2, '0'); // Add leading zero if needed
  return `${year}-${month}-${day}`;
}

