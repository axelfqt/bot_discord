const { ModalBuilder, TextInputBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection, Events, TextInputStyle, ButtonStyle, ChannelType } = require(`discord.js`);
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] }); 

client.commands = new Collection();

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/commands");

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.token)
})();

const ticketSchema = require('./Schemas.js/ticketSchema');
client.on(Events.InteractionCreate, async interaction => {
    if(interaction.isButton()) return;
    if(interaction.isChatInputCommand()) return;

    const modal = new ModalBuilder()
    .setTitle('With more informations')
    .setCustomId('modal')

    const email = new TextInputBuilder()
    .setCustomId('email')
    .setRequired(true)
    .setLabel('email')
    .setPlaceholder('Email')
    .setStyle(TextInputStyle.Short)

    const username = new TextInputBuilder()
    .setCustomId('username')
    .setRequired(true)
    .setLabel('username')
    .setPlaceholder('Username')
    .setStyle(TextInputStyle.Short)

    const reason = new TextInputBuilder()
    .setCustomId('reason')
    .setRequired(true)
    .setLabel('raison')
    .setPlaceholder('Raison')
    .setStyle(TextInputStyle.Short)

    const firstActionRow = new ActionRowBuilder().addComponents(email)
    const secondActionRow = new ActionRowBuilder().addComponents(username)
    const thirdActionRow = new ActionRowBuilder().addComponents(reason)

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    let choices;
    if(interaction.isStringSelectMenu()){
        choices = interaction.values;

        const result = choices.join('');

        ticketSchema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
            const filter = ({ Guild : interaction.guild.id});
            const update = {Ticket: result};

            ticketSchema.updateOne(filter, update, {
                new: true
            }).then(value => {
                console.log(value);
            })
        })
    }

    if(!interaction.isModalSubmit()){
        interaction.showModal(modal)
    }
})

client.on(Events.InteractionCreate, async interaction => {
    if(interaction.isModalSubmit()){
        if(interaction.customId == 'modal'){
            ticketSchema.findOne({ Guild: interaction.guild.id}, async (err,data) => {
                
                const emailInput = interaction.fields.getTextInputValue('email')
                const usernameInput = interaction.fields.getTextInputValue('username')
                const reasonInput = interaction.fields.getTextInputValue('reason')

                const postChannel = await interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
                if(postChannel) return await interaction.reply({ content: `u have already ticket open ${postChannel}`, ephemeral: true});

                const embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle(`${interaction.user.username} ticket`)
                .setDescription('Un staff va prendre votre demande le plus rapidement possible.')
                .addFields({ name: `Email`, value : `${emailInput}`})
                .addFields({ name: `Username`, value : `${usernameInput}`})
                .addFields({ name: `Raison`, value : `${reasonInput}`})
                .addFields({ name: `Type`, value : `${data.Ticket}`})
                .setFooter({ text: `${interaction.guild.name} tickets`})

                const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId('ticket')
                    .setLabel('Fermer')
                    .setStyle(ButtonStyle.Danger)
                )

                let channel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.id}`,
                    type: ChannelType.GuildText,
                    parent: `1079772865185992815`
                })

                channel.permissionOverwrites.create(interaction.user.id, { ViewChannel: true, SendMessages: true });
                channel.permissionOverwrites.create(channel.guild.roles.everyone, { ViewChannel: false, SendMessages: false });
                let msg = await channel.send({ embeds: [embed], components: [button]})
                await interaction.reply({ content: `Votre ticket est ouvert sur : ${channel}`, ephemeral: true});

                const collector = msg.createMessageComponentCollector()

                collector.on('collect', async i => {
                    ;(await channel).delete();


                    const dmEmbed = new EmbedBuilder()
                    .setColor("Blue")
                    .setTitle('Votre ticket est désormais fermé')
                    .setDescription("Le staff à décidé de fermer votre ticket (où c'est vous !)")
                    .setFooter({ text: `${interaction.guild.name} ticket`})
                    .setTimestamp()

                    await interaction.member.send({ embeds: [dmEmbed]}).catch(err => {
                        return;
                    })
                })
            })
        }
    }
})
