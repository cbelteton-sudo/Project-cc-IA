const axios = require('axios');

async function check() {
  try {
    const projectId = '2a117f0c-0318-493d-9a79-007b4a52cb84';
    const url = `http://localhost:4180/api/scrum/sprints/${projectId}`;
    console.log('Fetching:', url);
    const res = await axios.get(url);
    const sprints = res.data;
    const active = sprints.find((s) => s.status === 'ACTIVE');

    if (!active) {
      console.log('No active sprint');
      return;
    }

    console.log('Active Sprint Items:', active.items.length);

    let hasParent = 0;
    let hasParentContractor = 0;
    let hasDirectContractor = 0;

    active.items.forEach((i, idx) => {
      const b = i.backlogItem;
      const pid = b.parent ? b.parent.id : null;
      const pContr = b.parent ? b.parent.contractor : null;
      const pContrId = b.parent ? b.parent.contractorId : null;

      if (b.contractorId) hasDirectContractor++;
      if (b.parent) hasParent++;
      if (b.parent && (b.parent.contractor || b.parent.contractorId)) hasParentContractor++;

      if (b.parent) {
        console.log(
          `Item ${idx}: Parent ID: ${pid}, Parent Contractor:`,
          pContr,
          'Parent Contractor ID:',
          pContrId,
        );
      }
    });

    console.log(
      `Stats: DirectContr: ${hasDirectContractor}, Parents: ${hasParent}, ParentContr: ${hasParentContractor}`,
    );
  } catch (e) {
    console.error(e);
  }
}

check();
