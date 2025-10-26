const addBtn = document.getElementById('Add-T-Member');
const modal = document.getElementById('Team-member-Input-Container');
const cancelBtn = document.getElementById('Cancel-Btn');
const ConfirmTeamBtn = document.getElementById('Confirm-Member-Btn');
const FullName = document.getElementById('Team-Member-Name');
const EmailAddress = document.getElementById('Team-Member-Email');
const Role = document.getElementById('Team-Memeber-Role');
const TeamMemberView = document.getElementById('Team-Member-View');

const teamMetric = document.querySelector('#Body-Container-Metrics div:first-child h3');



addBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
});


cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});


modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
});


function renderTeamMembers() {
    const members = JSON.parse(localStorage.getItem('teamMembers')) || [];
    TeamMemberView.innerHTML = ''; // Clear previous content

    members.forEach((member, index) => {
        TeamMemberView.innerHTML += `
            <div id="TeamMemberContainer">
                <h3>${member.name}</h3>
                <p>${member.email}</p>
                <p>${member.role}</p>
                <button class="remove-member-btn" data-index="${index}">Remove</button>
            </div>
        `;
    });
}

// Add new member
ConfirmTeamBtn.addEventListener('click', () => {
    const name = FullName.value.trim();
    const email = EmailAddress.value.trim();
    const role = Role.value.trim();

    if (!name || !email || !role) return;

    const members = JSON.parse(localStorage.getItem('teamMembers')) || [];
    members.push({ name, email, role });
    localStorage.setItem('teamMembers', JSON.stringify(members));

    renderTeamMembers();

    FullName.value = '';
    EmailAddress.value = '';
    Role.value = '';
    modal.classList.add('hidden');
});

// Remove member using event delegation
TeamMemberView.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-member-btn')) {
        const index = e.target.getAttribute('data-index');
        const members = JSON.parse(localStorage.getItem('teamMembers')) || [];
        members.splice(index, 1); // Remove the member at that index
        localStorage.setItem('teamMembers', JSON.stringify(members));
        renderTeamMembers();
    }
});

// Render members on page load
window.addEventListener('DOMContentLoaded', () => {
    renderTeamMembers();
});
