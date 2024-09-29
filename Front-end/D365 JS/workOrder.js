function onChangeCustomer(executionContext) {
    const formContext = executionContext.getFormContext();
    formContext.getControl("new_fk_contact").addPreSearch(createContactsCustomView);
}

function createContactsCustomView(executionContext) {
    const formContext = executionContext.getFormContext();
    const control = formContext.getControl("new_fk_contact");

    if (!control) {
    console.error("Control not found: " + "new_fk_contact");
    return;
    }
    const customerRef = formContext.getAttribute("new_fk_customer").getValue();

    let customerId = null;
    if (customerRef !== null) {
        customerId = customerRef[0].id;
    }

    const fetchXmlContacts = `
        <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false">
            <entity name="new_my_contact">
            <attribute name="new_my_contactid"/>
            <attribute name="new_name"/>
            <attribute name="createdon"/>
            <order attribute="new_name" descending="false"/>
            </entity>
        </fetch>
    `;

    const fetchXmlFilteredContacts = `
        <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
            <entity name="new_my_contact">
            <attribute name="new_my_contactid"/>
            <attribute name="new_name"/>
            <attribute name="createdon"/>
            <order attribute="new_name" descending="false"/>
                <link-entity name="new_my_position" from="new_fk_contact" to="new_my_contactid" link-type="inner" alias="ps">
                    <filter type="and">
                        <condition attribute="new_fk_account" operator="eq" value="${customerId}"/>
                    </filter>
                </link-entity>
            </entity>
        </fetch>
    `;

    const fetchXml = customerId ? fetchXmlFilteredContacts : fetchXmlContacts;
    const viewId = "00000000-0000-0000-0000-000000000111";
    const viewDisplayName = "Filtered View";
    const layoutXml = `<grid name="resultset" object="1" jump="id" select="1" icon="1" preview="1">
        <row name="result" id="new_my_contactid">
            <cell name="new_name" width="150" />
            <cell name="createdon" width="150" />
        </row>
        </grid>`;

    control.addCustomView(
    viewId,
    "new_my_contact",
    viewDisplayName,
    fetchXml,
    layoutXml,
    true
    );
}

function setFieldsDisabledIfOrderClosed(executionContext) {
  const formContext = executionContext.getFormContext();
  const ClosedPostedValue = 100000001;
  const statusValue = formContext.getAttribute("new_os_status").getValue();
  if (statusValue === ClosedPostedValue) {
    toggleFieldsInWorkOrder(formContext, true);
  } else {
    toggleFieldsInWorkOrder(formContext, false);
  }
}

function toggleFieldsInWorkOrder(formContext, state) {
  const controls = formContext.ui.controls.get();
  controls.forEach((control) => {
    control.setDisabled(state);
  });
}

function onFormLoad(executionContext) {
  const formContext = executionContext.getFormContext();
  const ClosedPostedValue = 100000001;
  const statusValue = formContext.getAttribute("new_os_status").getValue();
  if (statusValue !== ClosedPostedValue) return;
  toggleFieldsInWorkOrder(formContext, true);
}