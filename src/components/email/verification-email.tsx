import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Tailwind,
} from '@react-email/components';

interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
}

const VerificationEmail = ({
  userName,
  verificationUrl,
}: VerificationEmailProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            <Section>
              <Text className="text-[32px] font-bold text-gray-900 mb-[24px] text-center">
                Verify Your Email Address
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] leading-[24px]">
                Hi {userName},
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] leading-[24px]">
                Thank you for signing up! To complete your account setup and
                ensure the security of your account, please verify your email
                address by clicking the button below.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={verificationUrl}
                  className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-blue-700"
                >
                  Verify Email Address
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-600 mb-[24px] leading-[20px]">
                If the button above doesn&apos;t work, you can also copy and
                paste the following link into your browser:
              </Text>

              <Text className="text-[14px] text-blue-600 mb-[32px] break-all">
                {verificationUrl}
              </Text>

              <Text className="text-[14px] text-gray-600 mb-[24px] leading-[20px]">
                This verification link will expire in 24 hours for security
                reasons. If you didn&apos;t create an account with us, please
                ignore this email.
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[8px]">
                Best regards,
              </Text>
              <Text className="text-[16px] text-gray-700 mb-[32px]">
                The Team
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerificationEmail;
