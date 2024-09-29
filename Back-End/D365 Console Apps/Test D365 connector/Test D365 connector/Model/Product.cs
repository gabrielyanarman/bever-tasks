using Microsoft.Xrm.Sdk;
using System;

namespace Test_D365_connector.Model
{
    internal class Product
    {
        public Guid productId {  get; set; }
        public string productName {  get; set; }
        public Money defaultPricePerUnit {  get; set; }
    }
}
