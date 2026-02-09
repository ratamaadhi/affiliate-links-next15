import { Resend } from 'resend';
import LinkReportNotification from '@/components/email/link-report-notification';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendReportEmailParams {
  to: string;
  pageOwnerName: string;
  linkTitle: string;
  linkUrl: string;
  reportReason: string;
  reportDescription?: string;
  reporterName?: string;
  reporterEmail?: string;
}

export async function sendReportEmail({
  to,
  pageOwnerName,
  linkTitle,
  linkUrl,
  reportReason,
  reportDescription,
  reporterName,
  reporterEmail,
}: SendReportEmailParams) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';
  const dashboardUrl = `${baseUrl}/dashboard/reports`;

  await resend.emails.send({
    from: 'Affiliate Links App <noreply@ratama.space>',
    to: [to],
    subject: `New Report: ${linkTitle}`,
    react: LinkReportNotification({
      pageOwnerName,
      linkTitle,
      linkUrl,
      reportReason,
      reportDescription,
      reporterName,
      reporterEmail,
      dashboardUrl,
    }),
  });
}
