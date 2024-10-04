using Microsoft.Xrm.Sdk;
using System;
using System.IO;
using System.Net;
using System.Xml;

namespace Transaction_Currency_Management.Utilities
{
    public class Helpers
    {
        public static decimal GetUsdRate()
        {
            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create("https://api.cba.am/exchangerates.asmx?op=ExchangeRatesByDate");
            webRequest.ContentType = "text/xml; charset=utf-8";
            webRequest.Accept = "text/xml";
            webRequest.Method = "POST";
            webRequest.KeepAlive = false;

            DateTime today = DateTime.Now;
            string formattedDate = today.ToString("yyyy-MM-dd");

            string soapXml = $@"<?xml version='1.0' encoding='utf-8'?>
                 <soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'>
                 <soap:Body>
                 <ExchangeRatesByDate xmlns='http://www.cba.am/'>
                 <date>{formattedDate}</date>
                 </ExchangeRatesByDate>
                 </soap:Body>
                 </soap:Envelope>";

            XmlDocument requestXml = new XmlDocument();
            requestXml.LoadXml(soapXml);

            Stream stream = webRequest.GetRequestStream();
            requestXml.Save(stream);

            WebResponse response = webRequest.GetResponse();

            XmlDocument responseXml = new XmlDocument();
            responseXml.Load(response.GetResponseStream());

            XmlNamespaceManager nsmgr = new XmlNamespaceManager(responseXml.NameTable);
            nsmgr.AddNamespace("soap", "http://schemas.xmlsoap.org/soap/envelope/");
            nsmgr.AddNamespace("ns", "http://www.cba.am/");

            XmlNode usdRateNode = responseXml.SelectSingleNode("//ns:ExchangeRate[ns:ISO='USD']", nsmgr);
            string usdRate = usdRateNode.SelectSingleNode("ns:Rate", nsmgr).InnerText;
            return Convert.ToDecimal(usdRate);
        }
        public static void UpdateUsdRateInTransactioncurrency(IOrganizationService service, decimal usdRate, Guid currencyId)
        {
            Entity transactionCurrency = new Entity("transactioncurrency");
            transactionCurrency.Id = currencyId;
            transactionCurrency["exchangerate"] = usdRate;
            service.Update(transactionCurrency);
        }
    }
}
