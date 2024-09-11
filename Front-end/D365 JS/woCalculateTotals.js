async function calculateTotals(formContext) {
  const workOrderId = formContext.data.entity.getId();

  let fetchXmlWOProduct = `
    <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false" aggregate="true">
      <entity name="new_work_order_product">
        <attribute name="new_mon_total_amount" aggregate="sum" alias="totalAmount"/>
          <filter type="and">
          <condition attribute="new_fk_work_order" operator="eq" value="${workOrderId}"/>
          </filter>
      </entity>
    </fetch>
  `;

  fetchXmlWOProduct = "?fetchXml=" + encodeURIComponent(fetchXmlWOProduct);

  const fetchProductResult = await Xrm.WebApi.retrieveMultipleRecords("new_work_order_product", fetchXmlWOProduct);
  const calculatedTotalAmount1 = fetchProductResult.entities[0].totalAmount;
  formContext.getAttribute("new_mon_total_products_amount").setValue(calculatedTotalAmount1)

  let fetchXmlWOService = `
    <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false" aggregate="true">
      <entity name="new_work_order_service">
        <attribute name="new_mon_total_amount" aggregate="sum" alias="totalAmount"/>
          <filter type="and">
          <condition attribute="new_fk_work_order" operator="eq" value="${workOrderId}"/>
          </filter>
      </entity>
    </fetch>
  `;
  

  fetchXmlWOService = "?fetchXml=" + encodeURIComponent(fetchXmlWOService);

  const fetchServiceResult = await Xrm.WebApi.retrieveMultipleRecords(
    "new_work_order_service",
    fetchXmlWOService
  );
  const calculatedTotalAmount2 = fetchServiceResult.entities[0].totalAmount;
  formContext.getAttribute("new_mon_total_services_amount").setValue(calculatedTotalAmount2)
}