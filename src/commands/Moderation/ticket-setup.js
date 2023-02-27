const { StringSelectMenuBuilder } = require("@discordjs/builders");
const { EmbedBuilder, ActionRowBuilder, ChannelType, PermissionsBitField, SelectMenuBuilder, SlashCommandBuilder } = require("discord.js");
const ticketSchema = require('../../Schemas.js/ticketSchema');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('ticket-set')
    .setDescription('create ticket')
    .addChannelOption(option => option.setName('channel').setDescription('channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addChannelOption(option => option.setName('category').setDescription('category').addChannelTypes(ChannelType.GuildCategory).setRequired(true)),

    async execute(interaction){
        
        if(!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: "Vous devez être administrateur pour utiliser cette commande.", ephemeral: true })

        const channel = interaction.options.getChannel('channel')
        const category = interaction.options.getChannel('category')

        ticketSchema.findOne({ Guild: interaction.guild.id }, async (err, data) => {

            if(!data){
                ticketSchema.create({
                    Guild: interaction.guild.id,
                    Channel: category.id,
                    Ticket: 'first'
                })
            } else{
                await interaction.reply({ content: "Vous avez déjà une instanciation de ticket" })
                return;
            }

            const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle('Dow Boost | Commande')
            .setDescription('Selectionnez une option')
            .setFooter({ text: `${interaction.guild.name} tickets`})

            const menu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                .setCustomId('select')
                .setMaxValues(1)
                .setPlaceholder('Selectionnez une option')
                .addOptions(
                    {
                        label: 'Boost MM+',
                        value: 'Sujet : Boost MM+ de 2 à 15'
                    },
                    {
                        label: 'Boost Leveling',
                        value: 'Sujet : Boost Leveling'
                    },
                    {
                        label: 'Autre',
                        value: 'Sujet : Indiquez le sujet dans le formulaire'
                    }
                )
            )

            await channel.send({ embeds : [embed], components: [menu]});
            await interaction.reply({ content: `Votre ticket est sur : ${channel}`, ephemeral: true})
        })

    }
}