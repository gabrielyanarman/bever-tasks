using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;

namespace Resource_Management
{
    public class AgeCalculator: CodeActivity
    {

        [Input("resourceDateOfBirth")]
        public InArgument <DateTime> ResourceDateOfBirth { get; set; }
        [Output("resourceAge")]
        public OutArgument<int> ResourceAge { get; set; }
        protected override void Execute(CodeActivityContext executionContext)
        {
            IWorkflowContext context = executionContext.GetExtension<IWorkflowContext>();
            IOrganizationServiceFactory serviceFactory = executionContext.GetExtension<IOrganizationServiceFactory>();
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService tracingService = executionContext.GetExtension<ITracingService>();
            IExecutionContext crmContext = executionContext.GetExtension<IExecutionContext>();

            try
            {
                DateTime resourceDateOfBirth = ResourceDateOfBirth.Get(executionContext);
                DateTime today = DateTime.Today;
                int age = today.Year - resourceDateOfBirth.Year;
                if (resourceDateOfBirth > today.AddYears(-age)) age--;
                if (resourceDateOfBirth > today)
                {
                    throw new InvalidPluginExecutionException("The provided date of birth is invalid. Please enter a valid date.");
                }
                ResourceAge.Set(executionContext, age);
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(ex.Message);
            }
        }
    }
}
