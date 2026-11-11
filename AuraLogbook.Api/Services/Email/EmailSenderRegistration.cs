namespace AuraLogbook.Api.Services.Email;

/// <summary>Chooses the <see cref="IEmailSender"/> for the current environment.</summary>
public static class EmailSenderRegistration
{
    /// <summary>
    /// Development always uses <see cref="DevelopmentLogEmailSender"/>. Other environments use
    /// <see cref="SmtpEmailSender"/> when <c>Email:Smtp</c> is configured, otherwise
    /// <see cref="UnavailableEmailSender"/>.
    /// </summary>
    /// <returns>True when a sender that can deliver mail (or log it in Development) is registered.</returns>
    public static bool AddAuraEmailSender(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        var section = configuration.GetSection(SmtpEmailOptions.SectionName);
        services.Configure<SmtpEmailOptions>(section);

        if (environment.IsDevelopment())
        {
            services.AddSingleton<IEmailSender, DevelopmentLogEmailSender>();
            return true;
        }

        var smtp = section.Get<SmtpEmailOptions>() ?? new SmtpEmailOptions();
        if (smtp.IsConfigured)
        {
            services.AddSingleton<ISmtpTransport, MailKitSmtpTransport>();
            services.AddSingleton<IEmailSender, SmtpEmailSender>();
            return true;
        }

        services.AddSingleton<IEmailSender, UnavailableEmailSender>();
        return false;
    }
}
