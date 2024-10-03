using Microsoft.Xrm.Sdk.Workflow;
using Microsoft.Xrm.Sdk;
using System;
using System.Activities;
using Work_Order_Management.Utilities;

namespace Work_Order_Management
{
    public class GenerateActualsAction : CodeActivity
    {
        [Output("status")]
        public OutArgument<string> Status { get; set; }
        protected override void Execute(CodeActivityContext executionContext)
        {
            IWorkflowContext context = executionContext.GetExtension<IWorkflowContext>();
            IOrganizationServiceFactory serviceFactory = executionContext.GetExtension<IOrganizationServiceFactory>();
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService tracingService = executionContext.GetExtension<ITracingService>();
            IExecutionContext crmContext = executionContext.GetExtension<IExecutionContext>();

            try
            {
                EntityReference workOrder = (EntityReference)crmContext.InputParameters["Target"];
                Guid workOredrId = workOrder.Id;
                Helpers.DeleteActualsFromWorkOrder(service, workOredrId);
                EntityCollection woProducts = Helpers.GetWorkOrderProducts(service, workOredrId);
                EntityCollection woServices = Helpers.GetWorkOrderServices(service, workOredrId);
                if (woProducts != null) Helpers.CreateActualsFromWorkOrderProducts(service, woProducts, workOredrId);
                if (woServices != null) Helpers.CreateActualsFromWorkOrderServices(service, woServices, workOredrId);
                Status.Set(executionContext, "Success");
            }
            catch (Exception ex)
            {
                Status.Set(executionContext, "Failure");
                throw new InvalidPluginExecutionException(ex.Message);
            }
        }
    }
}
