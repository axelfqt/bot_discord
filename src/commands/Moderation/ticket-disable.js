const { EmbedBuilder, ActionRowBuilder, ChannelType, PermissionsBitField, SelectMenuBuilder, SlashCommandBuilder } = require("discord.js");
const ticketSchema = require('../../Schemas.js/ticketSchema');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('ticket-disable')
    .setDescription('disable ticket'),

    async execute(interaction){
        
        if(!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: "Vous devez être administrateur pour utiliser cette commande.", ephemeral: true })

        ticketSchema.deleteMany({ Guild: interaction.guild.id}, async(err, data) => {
            await interaction.reply({ content: 'Ton ticket est supprimé.', ephermal: true})

        })
    }
}