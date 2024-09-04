
// const Contact = require('../models/contact');
// const sequelize = require('../util/database');
// const { Op } = require('sequelize');

// exports.postContact  = async (req, res) => {
//     const t = await sequelize.transaction();
//     const { email, phoneNumber } = req.body;
  
//     if (!email && !phoneNumber) {
//         await t.rollback();
//       return res.status(400).json({ error: 'Email or phoneNumber is required' });
//     }
  
//     try {
//       const existingContacts = await Contact.findAll({
//         where: {
//           [Op.or]: [
//             { email: email },
//             { phoneNumber: phoneNumber },
//           ],
//         },
//       });
  
//       if (existingContacts.length === 0) {
//         const newContact = await Contact.create({
//           email,
//           phoneNumber,
//           linkPrecedence: 'primary',
//         });
//         await t.commit();
//         return res.status(200).json({ contact: formatResponse(newContact) });
//       }
  
//       const primaryContact = existingContacts.find(contact => contact.linkPrecedence === 'primary') || existingContacts[0];
//       console.log(primaryContact)

//       const emails = [...new Set(existingContacts.map(contact => contact.email).filter(Boolean))];
//       const phoneNumbers = [...new Set(existingContacts.map(contact => contact.phoneNumber).filter(Boolean))];
//       const secondaryContactIds = existingContacts.filter(contact => contact.id !== primaryContact.id).map(contact => contact.id);
  

//       if (!existingContacts.some(contact => contact.email === email && contact.phoneNumber === phoneNumber)) {
//         await Contact.create({
//           email,
//           phoneNumber,
//           linkedId: primaryContact.id,
//           linkPrecedence: 'secondary',
//         });
//       }
//       await t.commit();
//       return res.status(200).json({
//         contact: {
//           primaryContactId: primaryContact.id,
//           emails,
//           phoneNumbers,
//           secondaryContactIds,
//         },
//       });
//     } catch (error) {
//         await t.rollback();
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//   };
  
//   const formatResponse = (contact) => {
//     return {
//       primaryContactId: contact.id,
//       emails: [contact.email],
//       phoneNumbers: [contact.phoneNumber],
//       secondaryContactIds: [],
//     };
//   };


const Contact = require('../models/contact');
const sequelize = require('../util/database');
const { Op } = require('sequelize');

exports.postContact = async (req, res) => {
    const t = await sequelize.transaction();
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        await t.rollback();
        return res.status(400).json({ error: 'Email or phoneNumber is required' });
    }

    try {
        // Find existing contacts that match email or phoneNumber
        const existingContacts = await Contact.findAll({
            where: {
                [Op.or]: [
                    { email: email },
                    { phoneNumber: phoneNumber },
                ],
            },
        });

        // If no existing contacts, create a new contact
        if (existingContacts.length === 0) {
            const newContact = await Contact.create({
                email,
                phoneNumber,
                linkPrecedence: 'primary',
            });
            await t.commit();
            return res.status(200).json({ contact: formatResponse(newContact) });
        }

        // Find the primary contact and secondary contacts
        const primaryContact = existingContacts.find(contact => contact.linkPrecedence === 'primary') || existingContacts[0];
        const secondaryContacts = existingContacts.filter(contact => contact.id !== primaryContact.id);

        // If the request does not match any existing contact, create a new secondary contact
        if (!existingContacts.some(contact => contact.email === email || contact.phoneNumber === phoneNumber)) {
            await Contact.create({
                email,
                phoneNumber,
                linkedId: primaryContact.id,
                linkPrecedence: 'secondary',
            });
        }

        // Update primary contact if needed
        if (primaryContact.linkPrecedence === 'secondary') {
            await primaryContact.update({ linkPrecedence: 'primary' });
        }

        // Update the linkPrecedence of old primary contact(s) to secondary if necessary
        await Promise.all(
            secondaryContacts.map(contact => contact.update({
                linkPrecedence: 'secondary',
                linkedId: primaryContact.id,
            }))
        );

        // Commit the transaction
        await t.commit();

        // Prepare the response
        const updatedContacts = await Contact.findAll({
            where: {
                [Op.or]: [
                    { email: email },
                    { phoneNumber: phoneNumber },
                ],
            },
        });

        const emails = [...new Set(updatedContacts.map(contact => contact.email).filter(Boolean))];
        const phoneNumbers = [...new Set(updatedContacts.map(contact => contact.phoneNumber).filter(Boolean))];
        const secondaryContactIds = updatedContacts.filter(contact => contact.linkPrecedence === 'secondary').map(contact => contact.id);

        return res.status(200).json({
            contact: {
                primaryContactId: primaryContact.id,
                emails,
                phoneNumbers,
                secondaryContactIds,
            },
        });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const formatResponse = (contact) => {
    return {
        primaryContactId: contact.id,
        emails: [contact.email],
        phoneNumbers: [contact.phoneNumber],
        secondaryContactIds: [],
    };
};
