async function generateActuals(formContext) {
  const workOrderId = formContext.data.entity.getId();
  const workOrderSchemaName = "new_work_order";

  const request = {
    entity: {
      id: workOrderId,
      entityType: workOrderSchemaName,
    },
    getMetadata: function () {
      const metadata = {
        boundParameter: "entity",
        parameterTypes: {
          entity: {
            typeName: "mscrm.new_work_order",
            structuralProperty: 5,
          },
        },
        operationName: "new_Generateactualsforworkorder",
        operationType: 0,
      };
      return metadata;
    },
  };
  const response = await Xrm.WebApi.online.execute(request);
  const result = await response.json();
  console.log(result.Status);
}
