﻿using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;

namespace Work_Order_Management.Utilities
{
    public static class Helpers
    {
        public static bool IsResourceAvailable(IOrganizationService service, Guid resourceId, DateTime startDate, DateTime endDate)
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
        public static EntityCollection GetWorkOrderProducts(IOrganizationService service, Guid workOrderId)
        {
            QueryExpression workOrderProductsQuery = new QueryExpression
            {
                EntityName = "new_work_order_product",
                ColumnSet = new ColumnSet("new_fk_inventory", "new_fk_product", "new_int_quantity", "new_mon_price_per_unit", "new_mon_total_amount", "new_mon_cost"),
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
        public static EntityCollection GetWorkOrderServices(IOrganizationService service, Guid workOrderId)
        {
            QueryExpression workOrderServicesQuery = new QueryExpression
            {
                EntityName = "new_work_order_service",
                ColumnSet = new ColumnSet("new_int_duration", "new_mon_price_per_unit", "new_mon_total_amount", "new_fk_service", "new_fk_resource"),
                Criteria =
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("new_fk_work_order", ConditionOperator.Equal, workOrderId)
                    }
                }
            };

            EntityCollection workOrderServices = service.RetrieveMultiple(workOrderServicesQuery);
            return workOrderServices;
        }
        public static void UpdateInventoryProduct(IOrganizationService service, Guid inventoryId, Guid productId, int quantity)
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
        public static void RemoveWorkOrderInvoices(IOrganizationService service, Guid workOrderId)
        {
            QueryExpression invoicesQuery = new QueryExpression
            {
                EntityName = "new_invoice",
                ColumnSet = new ColumnSet(null),
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                        {
                            new ConditionExpression("new_fk_work_order", ConditionOperator.Equal, workOrderId)
                        }
                }
            };

            EntityCollection invoices = service.RetrieveMultiple(invoicesQuery);
            if (invoices == null) return;
            foreach (Entity invoice in invoices.Entities)
            {
                service.Delete("new_invoice", invoice.Id);
            }
        }
        public static Guid CreateInvoiceForWorkOrder(IOrganizationService service, Guid woPriceListId, Guid woCustomerId, Guid workOrderId, string woNumber)
        {
            Entity invoice = new Entity("new_invoice");
            invoice["new_name"] = "INV-" + woNumber;
            invoice["new_fk_price_list"] = new EntityReference("new_price_list", woPriceListId);
            invoice["new_fk_customer"] = new EntityReference("new_my_accounts", woCustomerId);
            invoice["new_fk_work_order"] = new EntityReference("new_work_order", workOrderId);
            return service.Create(invoice);
        }
        public static void CreateWorkOrderInvoiceLines(IOrganizationService service, Guid invoiceId ,EntityCollection workOrderProducts, EntityCollection workOrderServices)
        {
            if(workOrderProducts != null)
            {
                foreach (Entity workOrderProduct in workOrderProducts.Entities)
                {
                    EntityReference productRef =  workOrderProduct.GetAttributeValue<EntityReference>("new_fk_product");
                    if (productRef == null) return;
                    Guid productId = productRef.Id;

                    Entity invoiceLine = new Entity("new_invoice_line");
                    invoiceLine["new_fk_invoice"] = new EntityReference("new_invoice", invoiceId);
                    invoiceLine["new_fk_product"] = new EntityReference("new_product", productId);
                    invoiceLine["new_dec_quantity"] = Convert.ToDecimal(workOrderProduct.GetAttributeValue<int>("new_int_quantity"));
                    invoiceLine["new_mon_price_per_unit"] = workOrderProduct.GetAttributeValue<Money>("new_mon_price_per_unit");
                    invoiceLine["new_mon_total_amount"] = workOrderProduct.GetAttributeValue<Money>("new_mon_total_amount");
                    service.Create(invoiceLine);
                }
            }
            if (workOrderServices != null)
            {
                foreach (Entity workOrderService in workOrderServices.Entities)
                {
                    EntityReference serviceRef = workOrderService.GetAttributeValue<EntityReference>("new_fk_product");
                    if (serviceRef == null) return;
                    Guid serviceId = serviceRef.Id;

                    Entity invoiceLine = new Entity("new_invoice_line");
                    invoiceLine["new_fk_invoice"] = new EntityReference("new_invoice", invoiceId);
                    invoiceLine["new_fk_product"] = new EntityReference("new_product", serviceId);
                    invoiceLine["new_dec_quantity"] = Convert.ToDecimal(workOrderService.GetAttributeValue<int>("new_int_duration"));
                    invoiceLine["new_mon_price_per_unit"] = workOrderService.GetAttributeValue<Money>("new_mon_price_per_unit");
                    invoiceLine["new_mon_total_amount"] = workOrderService.GetAttributeValue<Money>("new_mon_total_amount");
                    service.Create(invoiceLine);
                }
            }
        }
        public static string GetNameFromProduct(IOrganizationService service, Guid productId)
        {
            string logicalName = "new_product";
            Entity product = service.Retrieve(logicalName, productId, new ColumnSet("new_name"));
            return product.GetAttributeValue<string>("new_name");
        }
        public static Money GetHourlyRateFromResource(IOrganizationService service, Guid resourceId)
        {
            string logicalName = "new_resource";
            Entity resource = service.Retrieve(logicalName, resourceId, new ColumnSet("new_mon_hourly_rate"));
            return resource.GetAttributeValue<Money>("new_mon_hourly_rate");
        }
        public static void DeleteActualsFromWorkOrder(IOrganizationService service, Guid workOrderId)
        {
            QueryExpression actualsQuery = new QueryExpression
            {
                EntityName = "new_actual",
                ColumnSet = new ColumnSet(null),
                Criteria =
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions = {
                        new ConditionExpression("new_fk_work_order", ConditionOperator.Equal, workOrderId)
                    }
                }
            };
            EntityCollection actuals = service.RetrieveMultiple(actualsQuery);
            if (actuals == null) return;
            foreach (Entity actual in actuals.Entities)
            {
                service.Delete(actual.LogicalName, actual.Id);
            }           
        }
        public static void CreateActualsFromWorkOrderProducts(IOrganizationService service, EntityCollection workOrderProducts, Guid workOrderId)
        {
            foreach (Entity workOrderProduct in workOrderProducts.Entities)
            {
                string productName = null;
                EntityReference productRef = workOrderProduct.GetAttributeValue<EntityReference>("new_fk_product");
                if (productRef != null) productName = GetNameFromProduct(service, productRef.Id);
                Money costPerUnit = workOrderProduct.GetAttributeValue<Money>("new_mon_cost");
                decimal quantity = Convert.ToDecimal(workOrderProduct.GetAttributeValue<int>("new_int_quantity"));

                Entity actual = new Entity("new_actual");
                actual["new_name"] = productName;
                actual["new_fk_work_order"] = new EntityReference("new_work_order", workOrderId);
                actual["new_mon_cost_per_unit"] = costPerUnit;
                actual["new_dec_quantity"] = quantity;
                actual["new_mon_total_cost"] = new Money(quantity * costPerUnit.Value);
                service.Create(actual);
            }
        }
        public static void CreateActualsFromWorkOrderServices(IOrganizationService service, EntityCollection workOrderServices, Guid workOrderId)
        {
            foreach (Entity workOrderService in workOrderServices.Entities)
            {
                string serviceName = null;
                Money resourceHourlyRate = null;
                EntityReference serviceRef = workOrderService.GetAttributeValue<EntityReference>("new_fk_service");
                if (serviceRef != null) serviceName = GetNameFromProduct(service, serviceRef.Id);
                EntityReference resourceRef = workOrderService.GetAttributeValue<EntityReference>("new_fk_resource");
                if (resourceRef != null) resourceHourlyRate = GetHourlyRateFromResource(service, resourceRef.Id);
                decimal duration = Convert.ToDecimal(workOrderService.GetAttributeValue<int>("new_int_duration"))/60;

                Entity actual = new Entity("new_actual");
                actual["new_name"] = serviceName;
                actual["new_fk_work_order"] = new EntityReference("new_work_order", workOrderId);
                actual["new_mon_cost_per_unit"] = resourceHourlyRate;
                actual["new_dec_quantity"] = duration;
                actual["new_mon_total_cost"] = new Money(duration * resourceHourlyRate.Value);
                service.Create(actual);
            }
        }
    }
}
