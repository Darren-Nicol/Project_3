document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email; // add selector for submitting (sending email)

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none'; // add selector to remove single email view
  document.querySelectorAll("button").forEach(button => button.classList.remove("selected")); //loop through buttons and remove the one that has been selected in this case 'compose'
  document.querySelector(`#compose`).classList.add("selected"); 

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

// reply email 

function reply_email(email) {
  compose_email();
  document.querySelector('#compose-recipients').value = email["sender"];
  document.querySelector('#compose-subject').value =
      email["subject"].slice(0,4)==="Re: " ? email["subject"] : "Re: " + email["subject"] ;
  const pre_body_text = `\n \n \n------ On ${email['timestamp']} ${email["sender"]} wrote: \n \n`;
  document.querySelector('#compose-body').value = pre_body_text + email["body"].replace(/^/gm, "\t");
}

// archive email 

function archive_email(email_id, to_archive) {
  fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: to_archive 
      })
  }).then( () => load_mailbox("inbox"));

}

// load email 

function load_email(email_id, origin_mailbox){
  // load pages you do want and hide those you do not want
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none'; 
  document.querySelector('#single-email-view').style.display = 'block'; 

  document.querySelector('#single-email-content').innerHTML = '';
  document.querySelector('#single-email-back-section').innerHTML = '';

  fetch(`/emails/${email_id}`)
      .then(response => response.json())
      .then(email => {
        if ("error" in email) {console.log(email)}
        ["subject", "timestamp", "sender", "recipients", "body"].forEach(email_element => {
          const div_row = document.createElement('div');
          div_row.classList.add("row", `email-${email_element}-section`);
          if (email_element === "subject"){
            // Subject section and two buttons for replying/ archiving 
            // subject section
            const div_col_subject = document.createElement('div');
            div_col_subject.classList.add("col-8");
            div_col_subject.id = "email-subject-subsection";
            div_col_subject.innerHTML = `<p>${email[email_element]}</p>`;
            div_row.append(div_col_subject); 

            // Section for buttons
            const div_col_reply_archive = document.createElement('div');
            div_col_reply_archive.classList.add("col-4");
            div_col_reply_archive.id="archive-reply-button"; 
            const data_for_potential_buttons_to_add = [
              ["Reply", () => reply_email(email)], // reply button
              [email["archived"] ? "Unarchive" : "Archive", () => archive_email(email_id, !email["archived"])] // archived button
            ];

            // if email was sent then dont need archive
            (origin_mailbox === "sent" ? data_for_potential_buttons_to_add.slice(0,1) : data_for_potential_buttons_to_add)
            .forEach( text_function => {
              const text = text_function[0];
              const callback_func = text_function[1];
              const button = document.createElement("button");
              button.classList.add("float-right");
              button.innerHTML = text; 
              button.addEventListener('click', callback_func);
              div_col_reply_archive.append(button);
            });
            div_row.append(div_col_reply_archive);
          }
          else {
            div_row.innerHTML = `<p>${email[email_element]}</p>`;
          }
          document.querySelector("#single-email-content").append(div_row);
        });
        const back_button_row_div = document.createElement('div');
        back_button_row_div.classList.add("row");
        const back_button_col_div = document.createElement('div'); 
        back_button_col_div.classList.add("col-2", "offset-5");
        back_button_col_div.id = "back-button";
        back_button_col_div.innerHTML = `<p>${origin_mailbox.charAt(0).toUpperCase() + origin_mailbox.slice(1)}</p>`;
        back_button_col_div.addEventListener('click', () => load_mailbox(origin_mailbox));
        back_button_row_div.append(back_button_col_div);
        document.querySelector("#single-email-back-section").append(back_button_row_div);
      })
      .catch(error => conncole.log(error));

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  }).then();
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelectorAll("button").forEach(button => button.classList.remove("selected"));
  //document.querySelector(`#${mailbox}`).classList.add("selected"); // uncaught type error: classList of Null

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // update the mailbox with the latest emails 
  fetch(`/emails/${mailbox}`)
    .then(response => response.json()) // converts to json 
    .then(emails => {
      const sections_to_show = [['sender', 5], ['subject', 3], ['timestamp', 4]];
      const artificial_first_email = {'sender': 'Sender', 'subject': 'Subject', 'timestamp': 'Date and time', 'read': true}; // create artificial first email
      emails = [artificial_first_email, ...emails]; 
      emails.forEach(email => { // loop through emails from mailbox and create a div 
        const row_div_element = document.createElement('div');
        row_div_element.classList.add("row", "email-line-box", email["read"] ? "read" : "unread");
        if (email === artificial_first_email) {row_div_element.id = 'titled-first-row'};
        sections_to_show.forEach(
          section => {
            const section_name = section[0];
            const section_size = section[1];
            const div_section = document.createElement('div');
            div_section.classList.add(`col-${section_size}`, `${section_name}-section`);
            div_section.innerHTML = `<p>${email[section_name]}</p>`;
            row_div_element.append(div_section); // append to email list
                      });
          
        if (email !== artificial_first_email){
          row_div_element.addEventListener('click', () => load_email(email["id"], mailbox));
        }

        document.querySelector('#emails-view').append(row_div_element);
      })
    })

    .catch(error => console.log(error)); // if error from fetch catch and log to console

}

// Send an email 

function send_email(){
  const recipients = document.querySelector('#compose-recipients').value; //go to form and get me recipients and set to variable 
  const subject = document.querySelector('#compose-subject').value; 
  const body = document.querySelector('#compose-body').value;
  console.log(recipients); 

  // convert to json and post to emails
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({ 
      recipients: recipients,
      subject: subject,
      body: body
    })
  })

  .then(response => response.json()) // converts back to JS Object
    .then(result => {
      if ("message" in result){
        //Sent successfully 
        load_mailbox('sent'); // call load_mailbox function and pass in 'sent'
      }

      if ("error" in result) {
        //Not sent
        document.querySelector('#to-text-error-message').innerHTML = result['error']
      }

      console.log(result);
      console.log("message" in result);
      console.log("error" in result);
    })
      .catch(error => {
        console.log(error);
      });
  return false; 
}