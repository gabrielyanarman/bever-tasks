using Customer_Management.Utilities;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;

namespace Customer_Management
{
    public class PricePerUnitUpdaterOnPriceListChange : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                try
                {
                    Entity inventory = (Entity)context.InputParameters["Target"];
                    if (inventory.Contains("new_fk_price_list"))
                    {
                        if (inventory["new_fk_price_list"] == null) return;
                        QueryExpression inventoryProductsQuery = new QueryExpression
                        {
                            EntityName = "new_inventory_product",
                            ColumnSet = new ColumnSet("new_fk_product", "new_int_quantity"),
                            Criteria =
                            {
                                FilterOperator = LogicalOperator.And,
                                Conditions =
                                {
                                    new ConditionExpression("new_fk_inventory", ConditionOperator.Equal, inventory.Id)
                                }
                            }
                        };
                        EntityCollection inventoryProducts = service.RetrieveMultiple(inventoryProductsQuery);
                        EntityReference newPriceListRef = inventory.GetAttributeValue<EntityReference>("new_fk_price_list");
                        Guid newPriceListId = newPriceListRef.Id;
                        string priceListLogicalName = "new_price_list";
                        if (inventoryProducts.Entities.Count > 0)
                        {
                            foreach (Entity inventoryProduct in inventoryProducts.Entities)
                            {
                                EntityReference productRef = inventoryProduct.GetAttributeValue<EntityReference>("new_fk_product");
                                Guid productId = Guid.Empty;
                                if (productRef != null)
                                {
                                    productId = productRef.Id;
                                }
                                int quantity = inventoryProduct.GetAttributeValue<int>("new_int_quantity");
                                (EntityReference transactioncurrency, decimal exchangerate) = Helpers.GetCurrencyFromPriceList(service, priceListLogicalName, newPriceListId);
                                Money newPricePerUnit = Helpers.GetPricePerUnit(service, productId, newPriceListId, exchangerate);
                                if (transactioncurrency != null)
                                {
                                    inventoryProduct["transactioncurrencyid"] = transactioncurrency;
                                }
                                inventoryProduct["new_mon_price_per_unit"] = newPricePerUnit;
                                inventoryProduct["new_mon_total_amount"] = new Money(newPricePerUnit.Value * quantity);
                                service.Update(inventoryProduct);
                            }
                        }
                        (EntityReference transactioncurrency1, decimal exchangerate1) = Helpers.GetCurrencyFromPriceList(service, priceListLogicalName, newPriceListId);
                        if (transactioncurrency1 != null)
                        {
                            inventory["transactioncurrencyid"] = transactioncurrency1;
                        }
                    }
                }
                catch (Exception ex)
                {
                    throw new InvalidPluginExecutionException("Error accured in plugin: " + ex.Message);
                }
            }
        }
    }
}