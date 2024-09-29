using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Tooling.Connector;
using System;
using Test_D365_connector.Model;

namespace Test_D365_connector.Utilities
{
    internal class D365Connector
    {
        private string D365username;
        private string D365password;
        private string D365URL;

        private CrmServiceClient service;

        public D365Connector(string D365username, string D365password, string D365URL) 
        {
            this.D365username = D365username;
            this.D365password = D365password;
            this.D365URL = D365URL;
            string authType = "OAuth";
            string appId = "51f81489-12ee-4a9e-aaae-a2591f45987d";
            string reDirectURI = "app://58145B91-0C36-4500-8554-080854F2AC97";
            string loginPrompt = "Auto";

            string connectionString = string.Format(
               "AuthType={0};Username={1};Password={2};Url={3};AppId={4};RedirectUrI={5};LoginPrompt={6};",
               authType,
               D365username,
               D365password,
               D365URL,
               appId,
               reDirectURI,
               loginPrompt
           );

            this.service = new CrmServiceClient(connectionString);
        }  

        public InventoryProduct getInventoryProduct(Guid inventoryId, Guid productId)
        {
            InventoryProduct inventoryProductObj = null;
            QueryExpression inventoryProductQuery = new QueryExpression
            {
                EntityName = "new_inventory_product",
                ColumnSet = new ColumnSet("new_mon_price_per_unit", "new_int_quantity"),
                Criteria =
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("new_fk_inventory", ConditionOperator.Equal, inventoryId),
                        new ConditionExpression("new_fk_product", ConditionOperator.Equal, productId)
                    }

                }

            };
            EntityCollection inventoryProducts = service.RetrieveMultiple(inventoryProductQuery);
            if (inventoryProducts.Entities.Count > 0)
            {
                Entity inventoryProduct = inventoryProducts.Entities[0];
                inventoryProductObj = new InventoryProduct();
                inventoryProductObj.inventoryProductId = inventoryProduct.Id;                
                inventoryProductObj.quantity = inventoryProduct.GetAttributeValue<int>("new_int_quantity");
                inventoryProductObj.pricePerUnit = inventoryProduct.GetAttributeValue<Money>("new_mon_price_per_unit");               
            }
            return inventoryProductObj;
        }
        public PriceListItem getFoundedPriceListItem(Guid priceListId, Guid productId)
        {
            PriceListItem priceListItemObj = null;
            QueryExpression priceListItemQuery = new QueryExpression
            {
                EntityName = "new_price_list_item",
                ColumnSet = new ColumnSet("new_mon_price_per_unit"),
                Criteria =
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("new_fk_price_list", ConditionOperator.Equal, priceListId),
                        new ConditionExpression("new_fk_product", ConditionOperator.Equal, productId),
                    }
                }

            };

            EntityCollection priceListItems = service.RetrieveMultiple(priceListItemQuery);
            if(priceListItems.Entities.Count > 0)
            {
                Entity priceListItem = priceListItems.Entities[0];
                priceListItemObj = new PriceListItem();
                priceListItemObj.pricePerUnit = priceListItem.GetAttributeValue<Money>("new_mon_price_per_unit");
                EntityReference transactionCurrency = priceListItem.GetAttributeValue<EntityReference>("transactioncurrencyid");
            }

            return priceListItemObj;
        }
        public PriceList getPriceListFromId(Guid priceListId)
        {
            PriceList priceListObj = null;

            Entity priceList = service.Retrieve("new_price_list", priceListId, new ColumnSet("transactioncurrencyid", "exchangerate"));

            if (priceList != null)
            {
                priceListObj = new PriceList();
                priceListObj.exchangerate = priceList.GetAttributeValue<decimal>("exchangerate");

                EntityReference transactionCurrency = priceList.GetAttributeValue<EntityReference>("transactioncurrencyid");
                if (transactionCurrency != null)
                {
                    priceListObj.transactionCurrencyId = transactionCurrency.Id;
                }
            }
            else
            {
                Console.WriteLine("Price list not found for ID: " + priceListId);
            }

            return priceListObj;
        }

        public Inventory getInventoryFromName(string inventoryName)
        {
            Inventory inventoryObj = null;
            QueryExpression inventoryQuery = new QueryExpression
            {
                EntityName = "new_inventory",
                ColumnSet = new ColumnSet("new_fk_price_list"),
                Criteria =
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("new_name", ConditionOperator.Equal, inventoryName)
                    }
                }
            };
            EntityCollection inventories = service.RetrieveMultiple(inventoryQuery);
            if(inventories.Entities.Count > 0)
            {
                Entity inventory = inventories.Entities[0];
                inventoryObj = new Inventory();
                inventoryObj.inventoryId = inventory.Id;
                EntityReference priceList = inventory.GetAttributeValue<EntityReference>("new_fk_price_list");
                if(priceList != null)
                {
                    inventoryObj.inventoryPriceListId = priceList.Id;
                }
            }
            return inventoryObj;
        }
        public Product getProductFromName(string productName)
        {
            Product productObj = null;
            QueryExpression productQuery = new QueryExpression
            {
                EntityName = "new_product",
                ColumnSet= new ColumnSet("new_name", "new_mon_price_per_unit"),
                Criteria =
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("new_name", ConditionOperator.Equal, productName)
                    }
                }
            };
            EntityCollection products = service.RetrieveMultiple(productQuery);
            if(products.Entities.Count > 0)
            {
                Entity product = products.Entities[0];
                productObj = new Product();
                productObj.productId = product.Id;
                productObj.productName = product.GetAttributeValue<string>("new_name");
                productObj.defaultPricePerUnit = product.GetAttributeValue<Money>("new_mon_price_per_unit");

            }
            return productObj;
        }

        public void createInventoryProduct(Entity inventoryProduct)
        {
            service.Create(inventoryProduct);
        }

        public void updateInventoryProduct(Entity inventoryProduct)
        {
            service.Update(inventoryProduct);
        }

        public void deleteInventoryProduct(Guid inventoryProductId)
        {
            service.Delete("new_inventory_product", inventoryProductId);
        }
    }
}