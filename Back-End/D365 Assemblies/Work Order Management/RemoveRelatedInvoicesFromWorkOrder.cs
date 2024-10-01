using Microsoft.Xrm.Sdk.Workflow;
using Microsoft.Xrm.Sdk;
using System;
using System.Activities;
using Work_Order_Management.Utilities;

namespace Work_Order_Management
{
    public class RemoveRelatedInvoicesFromWorkOrder : CodeActivity
    {
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
                EntityReference workOrderReference = WorkOrderRef.Get(executionContext);
                if (workOrderReference == null) return;
                Guid workOrderId = workOrderReference.Id;
                Helpers.removeWorkOrderInvoices(service, workOrderId);
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(ex.Message);
            }
        }
    }
}
