import React from 'react';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

interface TermsProps {
  embedded?: boolean;
}

export default function Terms({ embedded = false }: TermsProps) {
  return (
    <Box sx={{ width: '100%', mt: embedded ? 0 : -4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Barta Community Code of Conduct
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
        Our commitment to respectful engagement
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Barta exists to help neighbors trade what they have for what they need.
        That only works if members treat each other with good judgment and
        respect.
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        This Code of Conduct sets the ground rules for everyone participating
        in the Barta community.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        Mission statement
      </Typography>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Barta facilitates and encourages communities to trade goods and
        services in ways that are beneficial for those involved, from both
        sides of the trade. Barta opens access to a wider range of valuable
        resources, and to more people than would otherwise be possible. We
        encourage you to take the initiative in connecting and cultivating
        real community in your neighborhood.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        1. Respectful and Courteous Behavior
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        Barta is built to be welcoming and inclusive. As a member, you&apos;re
        responsible for upholding decent, respectful behavior in every
        interaction. We ask that you would treat each other with kindness and
        empathy, and to make sure what you post is appropriate for all
        audiences.
      </Typography>

      <Typography variant="body1">Do not post:</Typography>
      <Box component="ul" sx={{ mt: 1, mb: 2 }}>
        <li>
          {' '}
          Anything illegal under local, state, federal, or international law.
          Please be aware of what laws apply to you.
        </li>
        <li>
          Art is allowed on Barta, but we do not allow explicit pornography.
          We do offer a means to mark listings as NSFW if they are for
          example: artistic rendentions of nude drawings, remakes of classical works,
          or content that is fanmade and for more mature audiences.
          Sexually explicit content of any kind should not be sent to other users
          in DMs, comments, or through posting- nor are sexual favors permitted
          as an acceptable service for trade.
        </li>
        <li>
          {' '}
          Targeted harrassment or abusive behavior aimed at either a specific
          individual or particular group of people.
          {' '}
        </li>
        <li>
          Imagery or other depictions of excessive violence of any sort, or glorification
          of that violence. While we welcome any contributions of say, hunters or
          fishing lovers looking to barter their latest catches- but trading weapons
          of any sort is strictly prohibitted.
        </li>
        <li>
          {' '}
          Use of Barta to solicit, cold call, or recruit users for other businesses, side projects,
          hustles. This extends to trying to take advantage of users in any way, shape or form-
          whether it be profitting of their free labor, an attempted scam, or a business/individual
          trying to hire on our app.
        </li>
      </Box>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Respectful, courteous behavior keeps Barta vibrant and supportive.
        Everyone should be able to trade, learn, and connect with confidence.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        2. Protecting Your Privacy
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        Protecting your privacy is your responsibility. Share only what
        you&apos;re comfortable with — including in your profile — and give
        your own information the same care Barta gives the community&apos;s.
      </Typography>

      <Box component="ul" sx={{ mt: 1, mb: 2 }}>
        <li>
          Be mindful of what you share in public listings, comments, and forums
        </li>
        <li>
          Use discretion before sharing personal details like your email
          address or phone number
        </li>
        <li>
          Review Barta&apos;s privacy settings and adjust them to control who
          can see your information
        </li>
      </Box>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Taking responsibility for your own privacy lets you participate with
        confidence. Barta takes security measures to protect the community,
        but you play an active role in protecting yourself.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        3. Intentional Contributions
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        You&apos;ll get the most out of Barta by being intentional. Engage with
        neighbors and posts that interest you. Give back by answering
        questions, sharing your experience, and showing up to events.
      </Typography>

      <Box component="ul" sx={{ mt: 1, mb: 2 }}>
        <li>
          Include clear photos with every barter listing. Images should clearly
          depict the item offered
        </li>
        <li>Offer helpful, constructive feedback to other members</li>
        <li>
          Leave thoughtful comments on listings and topics that interest you
        </li>
        <li>RSVP for and attend events that intrigue you</li>
      </Box>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Intentional involvement is how you learn from others, build real
        connections, and help other members do the same.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        4. Best Practices for Barter Listings
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        Barta works because listings clearly communicate what&apos;s on offer
        and what&apos;s being asked for. Clear, honest listings are what make a
        good trade possible.
      </Typography>

      <Box component="ul" sx={{ mt: 1, mb: 2 }}>
        <li>
          Describe the item or service accurately, including its condition
        </li>
        <li>
          Use real photos of the item you wish to trade – not stock images or
          photos of a different unit
        </li>
        <li>Disclose known defects or limitations up front</li>
        <li>
          If an item incorporates someone else&apos;s copyrighted or
          trademarked work, only list it if you have the right to trade it, and
          credit the original creator where relevant
        </li>
      </Box>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Accurate listings are what make trades trustworthy. When members can
        rely on a listing being honest, everyone trades with more confidence.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        5. Responsible Use of Community Features
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        Barta includes features to help members interact, including private
        messaging. Use these tools responsibly, and don&apos;t spam or send
        unsolicited messages.
      </Typography>

      <Typography variant="body1">We consider the following to be spam:</Typography>

      <Box component="ul" sx={{ mt: 1, mb: 2 }}>
        <li>
          Using likes, comments, private messages, or other features to draw
          attention to your profile in a disingenuous way
        </li>
        <li>
          Misusing community features for personal gain, or in a way that
          doesn&apos;t match their intended purpose
        </li>
        <li>
          Leaving irrelevant comments just to draw attention to your account
        </li>
        <li>
          Posting content that explicitly promotes an unrelated product or
          service
        </li>
        <li>
          Posting the same question in multiple places before anyone&apos;s
          had a chance to reply
        </li>
      </Box>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Using community features responsibly keeps Barta a place where members
        can engage with each other meaningfully.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        6. Private Messaging for Community Building
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        Private messaging is a powerful way to connect and collaborate with
        other members.
      </Typography>

      <Box component="ul" sx={{ mt: 1, mb: 2 }}>
        <li>Keep messages relevant and on-topic</li>
        <li>
          Personalize your messages. A boilerplate message feels impersonal
          and rarely gives the recipient enough context to respond. Mention
          something specific to them and explain why you are reaching out
        </li>
        <li>
          Have a specific reason, trade, or opportunity in mind before
          messaging someone. Avoid generic &quot;want to collaborate?&quot;
          messages
        </li>
      </Box>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Responsible, community-minded messaging builds the connections and
        partnerships that help everyone on Barta grow.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        7. Reporting Violations
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        If you see a post or comment that violates this Code of Conduct, please
        report it.
      </Typography>

      <Box component="ul" sx={{ mt: 1, mb: 2 }}>
        <li>Select Report on the post or comment in question</li>
        <li>
          Describe the issue and include any relevant details or evidence, such
          as a link to the post, a screenshot, etc.
        </li>
        <li>
          Barta&apos;s moderation team will review the report and take
          appropriate action
        </li>
      </Box>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Note: Barta reserves the right to remove content or suspend/ban accounts
        that are detrimental to the community, including without prior warning
        where a violation falls under Zero-Tolerance Violations below.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        8. Enforcement &amp; Consequences
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Barta uses a graduated enforcement system so members know what to
        expect if a guideline is broken.
      </Typography>

      <Table size="small" sx={{ mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell>Offense</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>1st</TableCell>
            <TableCell>Warning, and the content is removed from public view</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>2nd</TableCell>
            <TableCell>Temporary suspension</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>3rd</TableCell>
            <TableCell>Permanent ban</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Violations are tracked on a rolling [window — e.g. 12 months] basis.
        Content that violates this Code of Conduct is taken down from public
        view as soon as a violation is confirmed, and is retained privately by
        Barta&apos;s moderation team for [period — e.g. 30 days] in case of
        appeal or dispute before deletion.
      </Typography>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Zero-tolerance — illegal content
      </Typography>

      <Typography variant="body1" sx={{ mb: 4 }}>
        Illegal content (for example: stolen goods, prohibited weapons, or
        other content illegal under applicable law) does not follow the
        standard ladder above. It results in immediate permanent ban and
        content removal on the first offense, and may be reported to law
        enforcement where required.
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        Contact
      </Typography>

      <Typography variant="body1">
        Questions or concerns? Reach out to Barta&apos;s support team
        {' '}
        with any bugs, feedback or for business related reasons
        <a href="/contact"> here</a>
        . To appeal moderation actions, please fill out an appeal
        <a href="/help"> here.</a>
        {' '}
        Feel free to check out Barta&apos;s
        {' '}
        <a
          href="https://github.com/Sleeper-and-the-Insomniacs/thesis-barter-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub repository
        </a>
        {' '}
        for additional information.
      </Typography>
    </Box>
  );
}
