using Microsoft.Xrm.Sdk;
using System;
using Work_Order_Management.Utilities;

namespace Work_Order_Management
{
    public class WorkOrderClosureInventoryUpdater : IPlugin
    {
        private const int ClosedPostedValue = 100000001;
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
                    Entity workOrder = (Entity)context.InputParameters["Target"];
                    if (workOrder.Contains("new_os_status"))
                    {
                        OptionSetValue optionSetValue = workOrder.GetAttributeValue<OptionSetValue>("new_os_status");                       
                        if(optionSetValue?.Value == ClosedPostedValue)
                        {
                            EntityCollection workOrderProducts = Helpers.GetWorkOrderProducts(service, workOrder.Id);
                            if (workOrderProducts != null)
                            {
                                foreach (Entity workOrderProduct in workOrderProducts.Entities)
                                {
                                    EntityReference inventoryRef = workOrderProduct.GetAttributeValue<EntityReference>("new_fk_inventory");
                                    EntityReference productRef = workOrderProduct.GetAttributeValue<EntityReference>("new_fk_product");
                                    int quantity = workOrderProduct.GetAttributeValue<int>("new_int_quantity");
                                    if (inventoryRef == null || productRef == null || quantity == 0) return;
                                    Guid inventoryId = inventoryRef.Id;
                                    Guid productId = productRef.Id;
                                    Helpers.UpdateInventoryProduct(service, inventoryId, productId, quantity);
                                }
                            }
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
