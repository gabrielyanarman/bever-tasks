using Microsoft.Xrm.Sdk.Workflow;
using Microsoft.Xrm.Sdk;
using System;
using System.Activities;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Work_Order_Management.Utilities;

namespace Work_Order_Management
{
    public class GenerateNewInvoiceForWorkOrder : CodeActivity
    {
        [Input("woNumber")]
        public InArgument<string> WoNumber { get; set; }

        [Input("woPriceListRef")]
        [ReferenceTarget("new_price_list")]
        public InArgument<EntityReference> WoPriceListRef { get; set; }

        [Input("woCustomerRef")]
        [ReferenceTarget("new_my_accounts")]
        public InArgument<EntityReference> WoCustomerRef { get; set; }

        [Input("workOrderRef")]
        [ReferenceTarget("new_work_order")]
        public InArgument<EntityReference> WorkOrderRef { get; set; }


        protected override void Execute(CodeActivityContext executionContext)
        {
            IWorkflowContext context = executionContext.GetExtension<IWorkflowContext>();
            IOrganizationServiceFactory serviceFactory = executionContext.GetExtension<IOrganizationServiceFactory>();
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService tracingService = executionContext.GetExtension<ITracingService>();
            IExecutionContext crmContext = executionContext.GetExtension<IExecutionContext>();

            try
            {
                EntityReference woPriceListRef = WoPriceListRef.Get(executionContext);
                if (woPriceListRef == null) return;
                Guid woPriceListId = woPriceListRef.Id;
                EntityReference woCustomerRef = WoCustomerRef.Get(executionContext);
                if (woCustomerRef == null) return;                
                Guid woCustomerId = woCustomerRef.Id;
                EntityReference workOrderRef = WorkOrderRef.Get(executionContext);
                if (workOrderRef == null) return;
                Guid workOrderId = workOrderRef.Id;
                string workOrderName = WoNumber.Get(executionContext);
                int lastDashIndex = workOrderName.LastIndexOf('-');
                string woNumber = workOrderName.Substring(lastDashIndex + 1);
                EntityCollection woProducts = Helpers.GetWorkOrderProducts(service, workOrderId);
                EntityCollection woServices = Helpers.GetWorkOrderServices(service, workOrderId);

                Guid invoiceId = Helpers.CreateInvoiceForWorkOrder(service, woPriceListId, woCustomerId, workOrderId, woNumber);
                Helpers.CreateWorkOrderInvoiceLines(service, invoiceId, woProducts, woServices);
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(ex.Message);
            }
        }
    }
}
