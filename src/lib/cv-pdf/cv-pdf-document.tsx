import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { CvData } from '../../content/cv.ts'

/**
 * Standalone PDF rendering of the CV, built from the same `CvData` object
 * that drives the /cv web page (src/routes/cv.tsx) — one structured source,
 * two presentations, so a content edit never has to touch this file. Uses
 * @react-pdf/renderer's built-in Helvetica family rather than the web
 * page's Fira Sans/IBM Plex Mono: registering those as embedded PDF fonts
 * would add binary font-parsing risk for a print-only document where exact
 * brand-font fidelity isn't the point — legibility is (issue #14's
 * acceptance criteria).
 */

const styles = StyleSheet.create({
  page: {
    paddingVertical: 40,
    paddingHorizontal: 48,
    fontSize: 10,
    lineHeight: 1.4,
    color: '#1f2430',
  },
  name: {
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 700,
  },
  title: {
    fontSize: 12,
    lineHeight: 1,
    color: '#5b5a52',
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  contactLink: {
    fontSize: 9,
    color: '#1b3a5c',
    textDecoration: 'none',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    borderBottom: '1pt solid #e2d9c4',
    paddingBottom: 4,
    marginBottom: 8,
  },
  entry: {
    marginBottom: 10,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryRole: {
    fontSize: 11,
    fontWeight: 700,
  },
  entryDate: {
    fontSize: 9,
    color: '#5b5a52',
  },
  entrySubtitle: {
    fontSize: 9.5,
    color: '#5b5a52',
    marginTop: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  bulletMark: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  tech: {
    fontSize: 8.5,
    color: '#5b5a52',
    marginTop: 4,
  },
  skillRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  skillCategory: {
    width: 130,
    fontWeight: 700,
  },
  skillItems: {
    flex: 1,
  },
})

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>{'•'}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

export function CvPdfDocument({ cv }: { cv: CvData }) {
  return (
    <Document title={`${cv.name} — CV`} author={cv.name}>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{cv.name}</Text>
          <Text style={styles.title}>{cv.title}</Text>
          <View style={styles.contactRow}>
            <Link style={styles.contactLink} src={`mailto:${cv.contact.email}`}>
              {cv.contact.email}
            </Link>
            <Link style={styles.contactLink} src={`tel:${cv.contact.phone}`}>
              {cv.contact.phone}
            </Link>
            <Link style={styles.contactLink} src={cv.contact.linkedin}>
              {cv.contact.linkedin}
            </Link>
            <Link style={styles.contactLink} src={cv.contact.github}>
              {cv.contact.github}
            </Link>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text>{cv.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {cv.experience.map((entry) => (
            <View key={`${entry.company}-${entry.start}`} style={styles.entry} wrap={false}>
              <View style={styles.entryHeaderRow}>
                <Text style={styles.entryRole}>{entry.role}</Text>
                <Text style={styles.entryDate}>
                  {entry.start} – {entry.end}
                </Text>
              </View>
              <Text style={styles.entrySubtitle}>
                {entry.company} — {entry.location}
              </Text>
              {entry.highlights.map((highlight) => (
                <Bullet key={highlight} text={highlight} />
              ))}
              <Text style={styles.tech}>{entry.tech.join(', ')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {cv.projects.map((project) => (
            <View key={project.name} style={styles.entry} wrap={false}>
              <View style={styles.entryHeaderRow}>
                <Text style={styles.entryRole}>{project.name}</Text>
                <Text style={styles.entryDate}>
                  {project.start} – {project.end}
                </Text>
              </View>
              <Text style={styles.entrySubtitle}>
                {project.role}
                {project.teamSize ? ` — Team: ${project.teamSize}` : ''}
              </Text>
              {project.highlights.map((highlight) => (
                <Bullet key={highlight} text={highlight} />
              ))}
              <Text style={styles.tech}>{project.tech.join(', ')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {Object.entries(cv.skills).map(([category, items]) => (
            <View key={category} style={styles.skillRow}>
              <Text style={styles.skillCategory}>{category}</Text>
              <Text style={styles.skillItems}>{items.join(', ')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Education</Text>
          {cv.education.map((entry) => (
            <View key={entry.degree} style={styles.entry}>
              <View style={styles.entryHeaderRow}>
                <Text style={styles.entryRole}>{entry.degree}</Text>
                <Text style={styles.entryDate}>{entry.end}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{entry.school}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
