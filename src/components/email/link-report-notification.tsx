import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';

interface LinkReportNotificationProps {
  pageOwnerName: string;
  linkTitle: string;
  linkUrl: string;
  reportReason: string;
  reportDescription?: string;
  reporterName?: string;
  reporterEmail?: string;
  dashboardUrl: string;
}

const reasonLabels: Record<string, string> = {
  broken: 'Broken Link',
  inappropriate: 'Inappropriate Content',
  spam: 'Spam',
  other: 'Other',
};

const LinkReportNotification = ({
  pageOwnerName,
  linkTitle,
  linkUrl,
  reportReason,
  reportDescription,
  reporterName,
  reporterEmail,
  dashboardUrl,
}: LinkReportNotificationProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New report submitted for your link: {linkTitle}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            {/* Header */}
            <Section className="text-center mb-[32px]">
              <Heading className="text-[24px] font-bold text-gray-900 m-0">
                Link Report Notification
              </Heading>
            </Section>

            {/* Main Content */}
            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[16px]">
                Hello {pageOwnerName},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[16px]">
                Someone has submitted a report for one of your links:
              </Text>
            </Section>

            {/* Link Details */}
            <Section className="bg-gray-50 border border-gray-200 rounded-[6px] p-[16px] mb-[24px]">
              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[4px] m-0">
                <strong>Link Title:</strong> {linkTitle}
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[4px] m-0">
                <strong>URL:</strong>{' '}
                <Link href={linkUrl} className="text-blue-600 underline">
                  {linkUrl}
                </Link>
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0">
                <strong>Reason:</strong>{' '}
                {reasonLabels[reportReason] || reportReason}
              </Text>
            </Section>

            {/* Report Details */}
            {reportDescription && (
              <Section className="mb-[24px]">
                <Text className="text-[14px] text-gray-600 leading-[20px] mb-[8px] m-0">
                  <strong>Additional Details:</strong>
                </Text>
                <Text className="text-[14px] text-gray-700 leading-[20px] m-0">
                  {reportDescription}
                </Text>
              </Section>
            )}

            {/* Reporter Info */}
            {(reporterName || reporterEmail) && (
              <Section className="mb-[24px]">
                <Text className="text-[14px] text-gray-600 leading-[20px] mb-[8px] m-0">
                  <strong>Submitted By:</strong>
                </Text>
                {reporterName && (
                  <Text className="text-[14px] text-gray-700 leading-[20px] m-0">
                    {reporterName}
                  </Text>
                )}
                {reporterEmail && (
                  <Text className="text-[14px] text-gray-700 leading-[20px] m-0">
                    {reporterEmail}
                  </Text>
                )}
              </Section>
            )}

            {/* CTA Button */}
            <Section className="text-center mb-[32px]">
              <Button
                href={dashboardUrl}
                className="bg-blue-600 text-white px-[32px] py-[12px] rounded-[6px] text-[16px] font-semibold no-underline box-border inline-block"
              >
                View Reports in Dashboard
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default LinkReportNotification;
