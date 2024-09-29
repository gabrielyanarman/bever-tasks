using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;

namespace Work_Order_Management.Utilities
{
    public static class Helpers
    {
        public static bool isResourceAvailable(IOrganizationService service, Guid resourceId, DateTime startDate, DateTime endDate)
        {
            QueryExpression bookingsQuery = new QueryExpression
            {
                EntityName = "new_booking",
                ColumnSet = new ColumnSet("new_fk_resource", "new_dt_start_date", "new_dt_end_date"),
                Criteria =
                        {
                            FilterOperator = LogicalOperator.And,
                            Conditions =
                            {
                                new ConditionExpression("new_fk_resource", ConditionOperator.Equal, resourceId),
                                new ConditionExpression("new_dt_end_date", ConditionOperator.GreaterEqual, startDate),
                                new ConditionExpression("new_dt_start_date", ConditionOperator.LessEqual, endDate)
                            }
                        }
            };

            EntityCollection bookings = service.RetrieveMultiple(bookingsQuery);

            return bookings.Entities.Count == 0;
        }
        public static EntityCollection getWorkOrderProducts(IOrganizationService service, Guid workOrderId)
        {
            QueryExpression workOrderProductsQuery = new QueryExpression
            {
                EntityName = "new_work_order_product",
                ColumnSet = new ColumnSet("new_fk_inventory", "new_fk_product", "new_int_quantity"),
                Criteria = 
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("new_fk_work_order", ConditionOperator.Equal, workOrderId)
                    }
                }
            };

            EntityCollection workOrderProducts = service.RetrieveMultiple(workOrderProductsQuery);
            return workOrderProducts;
        }
        public static void updateInventoryProduct(IOrganizationService service, Guid inventoryId, Guid productId, int quantity)
        {
            QueryExpression inventoryProductsQuery = new QueryExpression
            {
                EntityName = "new_inventory_product",
                ColumnSet = new ColumnSet("new_int_quantity", "new_mon_price_per_unit"),
                Criteria =
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("new_fk_inventory", ConditionOperator.Equal, inventoryId),
                        new ConditionExpression("new_fk_product", ConditionOperator.Equal, productId),
                    }
                }
            };

            EntityCollection inventoryProducts = service.RetrieveMultiple(inventoryProductsQuery);
            if(inventoryProducts.Entities.Count > 0)
            {
                Entity inventoryProduct = inventoryProducts.Entities[0];
                int ipQuantity = inventoryProduct.GetAttributeValue<int>("new_int_quantity");
                Money pricePerUnit = inventoryProduct.GetAttributeValue<Money>("new_mon_price_per_unit");
                if(quantity < ipQuantity)
                {
                    inventoryProduct.Attributes.Clear();
                    int newQuantity = ipQuantity - quantity;
                    inventoryProduct["new_int_quantity"] = newQuantity;
                    inventoryProduct["new_mon_total_amount"] = new Money(newQuantity * pricePerUnit.Value);
                    service.Update(inventoryProduct);
                } else if(quantity == ipQuantity)
                {
                    service.Delete("new_inventory_product", inventoryProduct.Id);
                } else
                {
                    throw new InvalidPluginExecutionException("Тhere is not enough product in the inventory.");
                }
            }
            else
            {
                throw new InvalidPluginExecutionException("Тhere is not enough product in the inventory.");
            }
        }
    }
}
